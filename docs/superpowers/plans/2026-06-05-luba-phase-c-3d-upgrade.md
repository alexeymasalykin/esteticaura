# Фаза C — 3D-апгрейд (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Довести 3D-сцену до студийного «вау»-уровня: дорогое стекло капли и золотой кристалл с
реальными отражениями, bloom-свечение, плавный обратимый морфинг капля→кристалл и золотая пыль
вместо квадратных точек — на стартовых параметрах из референс-борда, тюнингуемых через lil-gui.

**Architecture:** Материалы доводятся до параметров борда (§2.1–2.2). Добавляется
`PostProcessing` (EffectComposer → UnrealBloomPass → OutputPass), который `Experience` использует
вместо прямого `renderer.render` — **только на десктопе** (дорогой проход; полная деградация —
Фаза D). Морфинг переписывается на чисто scale-tween'ы (без visibility-переключателей) → он
обратим при скролле вверх; конфликт «дыхание капли vs морф-tween» (carry-forward Фазы A) решается
гейтом дыхания по `scale.x`. Частицы получают круглую canvas-маску. `Debug` (lil-gui, динамический
импорт, по `#debug`) даёт ручной тюнинг.

**Tech Stack:** Three.js r160 (+ addons postprocessing/environments), GSAP 3.13, lil-gui 0.21
(уже в deps). **Новых зависимостей не требуется.**

**Спека:** `docs/superpowers/specs/2026-06-05-luba-lending-redesign-design.md` (§5).
**Референс-параметры:** `docs/superpowers/references/2026-06-05-reference-board.md` (§2.1–2.4).
**Carry-forward:** `docs/superpowers/notes/phase-a-review-carryforward.md` (дыхание vs морф — решается в Task 2+6).

> **Про TDD:** Фаза C — рендер-код (материалы, постпроцессинг, морфинг, шейдер-пыль), для которого
> юнит-тесты не осмысленны. Верификация каждого шага — `npm run build` (зелёный), `node --check`,
> и **визуальная приёмка** (`npm run dev`, тюнинг через `#debug`). Vitest-набор Фазы B (13 тестов)
> должен оставаться зелёным (`npm test`) — мы его не трогаем.

## Граница фазы (что НЕ здесь — Фаза D)
- Полная деградация: динамический импорт Three.js, статичный постер на mobile/слабом GPU,
  пауза рендера по `IntersectionObserver`, JS-гейтинг `prefers-reduced-motion` (отключение
  ScrollTrigger/параллакса). В Фазе C bloom включается простым десктоп-гейтом
  (`matchMedia('(min-width:1024px)')`); тонкую деградацию делает Фаза D.

## Инвариант сборки
Сборка зелёная (конец Фазы B). Остаётся зелёной на каждом коммите. `PostProcessing`/`Debug`
создаются файлами раньше, чем импортируются в `Experience` (в той же задаче: сначала файл, потом
импорт). `npm test` (13 тестов Фазы B) не должен сломаться.

---

## File Structure (после Фазы C)

```
src/webgl/Experience.js          изменён: ACESFilmic + exposure 1.1; рендер через composer; resize composer; Debug
src/webgl/PostProcessing.js      СОЗДАН: EffectComposer + UnrealBloomPass + OutputPass (десктоп-гейт)
src/webgl/Debug.js               СОЗДАН: lil-gui по #debug (динамический импорт), тюнинг bloom/материалов
src/webgl/World/World.js         изменён: обратимый морфинг (scale-tween'ы, без visibility-toggle), вспышка частиц
src/webgl/World/Droplet.js       изменён: studio-материал (борд §2.1), this.material, гейт дыхания по scale.x
src/webgl/World/Crystal.js       изменён: studio-материал (борд §2.2), this.material, scale(0)+visible (обратимо)
src/webgl/World/Particles.js     изменён: круглая canvas-маска (золотая пыль) + size-мерцание
```

---

## Task 1: Тон-маппинг ACESFilmic

Спека §5.6: `ACESFilmic` exposure ~1.1 (вместо текущего Reinhard 1.5). ACESFilmic корректнее для
PBR и лучше дружит с bloom (борд §note 1).

**Files:**
- Modify: `src/webgl/Experience.js`

- [ ] **Step 1: Заменить тон-маппинг**

Текущие строки в `Experience.js`:
```js
        this.renderer.toneMapping = THREE.ReinhardToneMapping
        this.renderer.toneMappingExposure = 1.5
```
Заменить на:
```js
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        this.renderer.toneMappingExposure = 1.1
```

- [ ] **Step 2: Сборка + тесты**

Run: `npm run build && npm test`
Expected: `✓ built`; `Tests  13 passed`.

- [ ] **Step 3: Commit**

```bash
git add src/webgl/Experience.js
git commit -m "feat(3d): ACESFilmic tone mapping (exposure 1.1)"
```

---

## Task 2: Капля — studio-материал + фикс дыхания

Доводим материал до борда §2.1 (дорогое стекло). Сохраняем материал в `this.material` (для lil-gui).
Решаем carry-forward: дыхание (set `scale.y`) конфликтует с морф-tween'ом (`scale → 0`). Гейтим
дыхание по `this.mesh.scale.x < 0.99` — пока tween сжимает каплю, дыхание молчит; вернулись к hero
(scale ≈ 1) — дыхание снова работает. Полностью обратимо, без флагов.

**Files:**
- Modify: `src/webgl/World/Droplet.js`

- [ ] **Step 1: Полностью заменить `src/webgl/World/Droplet.js` на:**

```js
import * as THREE from 'three'

// Hero object: expensive glass/water droplet (reference board §2.1).
// Requires scene.environment (set by Environment) — transmission needs an env map.
export default class Droplet {
    constructor(experience) {
        this.scene = experience.scene

        const geometry = new THREE.SphereGeometry(1, 64, 64)
        this.material = new THREE.MeshPhysicalMaterial({
            color: '#ffffff',
            transmission: 1,
            thickness: 0.5,        // required for refraction at this object scale
            roughness: 0.05,       // 0–0.15 polished glass; 0.2–0.6 pixelates — avoid
            ior: 1.33,             // water
            clearcoat: 1,
            clearcoatRoughness: 0,
            iridescence: 0.2       // faint nacre
        })
        this.mesh = new THREE.Mesh(geometry, this.material)
        this.mesh.position.set(0, 0, 0)
        this.scene.add(this.mesh)
    }

    update(elapsedTime) {
        if (!this.mesh.visible) return
        // Pause self-animation while the scroll morph shrinks us (scale.x < ~1):
        // prevents the breathing scale.y from fighting the morph tween (Phase A carry-forward).
        if (this.mesh.scale.x < 0.99) return

        this.mesh.rotation.y = elapsedTime * 0.2
        this.mesh.position.y = Math.sin(elapsedTime) * 0.2
        this.mesh.scale.y = 1 + Math.sin(elapsedTime * 2) * 0.1
    }
}
```

- [ ] **Step 2: Проверка + сборка + тесты**

Run: `node --check src/webgl/World/Droplet.js && npm run build && npm test`
Expected: ok; `✓ built`; `13 passed`.

- [ ] **Step 3: Commit**

```bash
git add src/webgl/World/Droplet.js
git commit -m "feat(3d): studio glass droplet (transmission/ior/iridescence), morph-safe breathing"
```

---

## Task 3: Кристалл — studio-материал + обратимая видимость

Борд §2.2: золотой металл, `envMapIntensity 1.2`. Делаем кристалл обратимым: вместо `visible=false`
ставим стартовый `scale(0,0,0)` при `visible=true`. При scale 0 он невидим (точка), морф-tween
масштабирует его в 1.5; на скролле вверх tween возвращает в 0 → снова невидим. Никаких
visibility-переключателей (которые ломались при реверсе скролла).

**Files:**
- Modify: `src/webgl/World/Crystal.js`

- [ ] **Step 1: Полностью заменить `src/webgl/World/Crystal.js` на:**

```js
import * as THREE from 'three'

// Scroll-target object: faceted gold crystal (reference board §2.2).
// Starts at scale 0 (invisible) and is scaled in by the morph — fully reversible on scroll-up.
export default class Crystal {
    constructor(experience) {
        this.scene = experience.scene

        const geometry = new THREE.IcosahedronGeometry(1, 0)
        this.material = new THREE.MeshPhysicalMaterial({
            color: '#F7E7CE',      // champagne base; env map paints the gold reflections
            metalness: 1,
            roughness: 0.15,
            flatShading: true,
            envMapIntensity: 1.2
        })
        this.mesh = new THREE.Mesh(geometry, this.material)
        this.mesh.position.set(0, 0, 0)
        this.mesh.scale.set(0, 0, 0)   // invisible until the morph scales it in
        this.scene.add(this.mesh)
    }

    update(elapsedTime) {
        this.mesh.rotation.x = elapsedTime * 0.3
        this.mesh.rotation.y = elapsedTime * 0.3
    }
}
```

- [ ] **Step 2: Проверка + сборка + тесты**

Run: `node --check src/webgl/World/Crystal.js && npm run build && npm test`
Expected: ok; `✓ built`; `13 passed`.

- [ ] **Step 3: Commit**

```bash
git add src/webgl/World/Crystal.js
git commit -m "feat(3d): studio gold crystal (metalness/envMapIntensity), scale-0 reversible reveal"
```

---

## Task 4: Частицы — золотая пыль (круглая маска)

Спека §5.5: круглая alpha-маска вместо квадратных точек + мягкое мерцание. Делаем процедурную
круглую текстуру через `<canvas>` радиальный градиент (без файла), ставим её `map` на
`PointsMaterial` (золотой цвет тонирует белый спрайт). Мерцание — лёгкая пульсация `size` в `update`
(не `opacity` — её во время морфа твинит World, см. Task 6; конфликта избегаем).

**Files:**
- Modify: `src/webgl/World/Particles.js`

- [ ] **Step 1: Полностью заменить `src/webgl/World/Particles.js` на:**

```js
import * as THREE from 'three'

// Gold dust: 5000 additive round sprites (procedural circular alpha mask, no asset file).
export default class Particles {
    constructor(experience) {
        this.scene = experience.scene
        this.count = 5000
        this.baseSize = 0.15

        this.setGeometry()
        this.setMaterial()
        this.setPoints()
    }

    setGeometry() {
        this.geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(this.count * 3)
        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3
            positions[i3] = (Math.random() - 0.5) * 25
            positions[i3 + 1] = (Math.random() - 0.5) * 25
            positions[i3 + 2] = (Math.random() - 0.5) * 25
        }
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    }

    // Procedural soft circle (radial gradient) → round particles instead of squares.
    createCircleTexture() {
        const size = 64
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
        g.addColorStop(0, 'rgba(255,255,255,1)')
        g.addColorStop(0.4, 'rgba(255,255,255,0.6)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, size, size)
        const texture = new THREE.CanvasTexture(canvas)
        texture.colorSpace = THREE.SRGBColorSpace
        return texture
    }

    setMaterial() {
        this.material = new THREE.PointsMaterial({
            color: '#D4AF37',
            map: this.createCircleTexture(),
            size: this.baseSize,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.6
        })
    }

    setPoints() {
        this.points = new THREE.Points(this.geometry, this.material)
        this.scene.add(this.points)
    }

    update(elapsedTime) {
        this.points.rotation.y = elapsedTime * 0.05
        this.points.rotation.x = elapsedTime * 0.02
        // Soft shimmer via size pulse (opacity is reserved for the morph flash in World).
        this.material.size = this.baseSize + Math.sin(elapsedTime * 2) * 0.03
    }
}
```

- [ ] **Step 2: Проверка + сборка + тесты**

Run: `node --check src/webgl/World/Particles.js && npm run build && npm test`
Expected: ok; `✓ built`; `13 passed`.

- [ ] **Step 3: Commit**

```bash
git add src/webgl/World/Particles.js
git commit -m "feat(3d): gold dust particles (procedural round mask, size shimmer)"
```

---

## Task 5: Bloom-постпроцессинг

Борд §2.4: `EffectComposer → RenderPass → UnrealBloomPass(0.4,1.2,0.1) → OutputPass`
(**OutputPass обязателен последним** — переносит тон-маппинг, иначе ломает гамму). Дорогой проход →
**только десктоп** (`matchMedia('(min-width:1024px)')`); полная деградация — Фаза D. `Experience`
рендерит через composer, если он включён, иначе обычным `renderer.render`.

**Files:**
- Create: `src/webgl/PostProcessing.js`
- Modify: `src/webgl/Experience.js`

- [ ] **Step 1: Создать `src/webgl/PostProcessing.js`:**

```js
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

// Gold glow on bright highlights/particles. Desktop-only in Phase C (expensive pass).
// OutputPass MUST be last: it takes over tone mapping (board §note 1).
export default class PostProcessing {
    constructor(experience) {
        this.experience = experience
        this.enabled = window.matchMedia('(min-width: 1024px)').matches
        if (!this.enabled) return

        const { renderer, scene, camera, sizes } = experience

        this.composer = new EffectComposer(renderer)
        this.composer.setSize(sizes.width, sizes.height)
        this.composer.setPixelRatio(sizes.pixelRatio)

        this.composer.addPass(new RenderPass(scene, camera))

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(sizes.width, sizes.height),
            0.4,   // strength — gold on black, keep conservative
            1.2,   // radius
            0.1    // threshold
        )
        this.composer.addPass(this.bloomPass)

        this.composer.addPass(new OutputPass())
    }

    resize() {
        if (!this.enabled) return
        this.composer.setSize(this.experience.sizes.width, this.experience.sizes.height)
        this.composer.setPixelRatio(this.experience.sizes.pixelRatio)
    }

    render() {
        this.composer.render()
    }
}
```

- [ ] **Step 2: Подключить в `src/webgl/Experience.js`**

(a) Добавить импорт рядом с `import World from './World/World.js'`:
```js
import PostProcessing from './PostProcessing.js'
```

(b) Сразу ПОСЛЕ `this.world = new World(this)` (и до `this.ready = true`) добавить:
```js
        this.postProcessing = new PostProcessing(this)
```

(c) В методе `resize()`, в самом конце (после `this.renderer.setPixelRatio(...)`), добавить:
```js
        if (this.postProcessing) this.postProcessing.resize()
```

(d) В методе `tick()` заменить строку `this.renderer.render(this.scene, this.camera)` на:
```js
        if (this.postProcessing && this.postProcessing.enabled) {
            this.postProcessing.render()
        } else {
            this.renderer.render(this.scene, this.camera)
        }
```

- [ ] **Step 3: Сборка + тесты**

Run: `node --check src/webgl/PostProcessing.js && npm run build && npm test`
Expected: ok; `✓ built`; `13 passed`.

- [ ] **Step 4: Визуальная проверка transmission сквозь composer**

Run: `npm run dev` (десктоп-ширина окна). Убедиться (борд §note 3):
- капля остаётся прозрачной и корректной (не чёрной/плоской) при включённом composer;
- золотые частицы/блики слегка светятся (bloom), но не пересвечены;
- общий тон не «выгорел» (OutputPass на месте).
Если капля стала чёрной/битой — это известный риск transmission+composer; зафиксировать как
DONE_WITH_CONCERNS с описанием, НЕ менять порядок проходов (OutputPass последним обязателен).

- [ ] **Step 5: Commit**

```bash
git add src/webgl/PostProcessing.js src/webgl/Experience.js
git commit -m "feat(3d): UnrealBloom post-processing (desktop-only), render via EffectComposer"
```

---

## Task 6: Морфинг капля→кристалл — обратимый crossfade

Переписываем `setupScrollAnimations`: чистые scale-tween'ы (капля → 0, кристалл 0 → 1.5) без
visibility-переключателей, поэтому морф обратим при скролле вверх. Вспышка частиц (`opacity`) на
переходе. Камера-долли. Дыхание капли само замолкает при `scale.x < 0.99` (Task 2), кристалл
невидим при scale 0 (Task 3) — никаких флагов/visibility-callback'ов.

**Files:**
- Modify: `src/webgl/World/World.js` (только метод `setupScrollAnimations`)

- [ ] **Step 1: Заменить метод `setupScrollAnimations()` в `World.js` на:**

```js
    setupScrollAnimations() {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1
            }
        })

        // Hero -> Services: droplet shrinks out (its breathing auto-pauses at scale.x < 0.99).
        tl.to(this.droplet.mesh.scale, { x: 0, y: 0, z: 0, duration: 1 }, 1)

        // Particle flash across the transition (opacity is owned by the morph, not by update()).
        tl.to(this.particles.material, { opacity: 1, duration: 0.25 }, 1.25)
        tl.to(this.particles.material, { opacity: 0.6, duration: 0.5 }, 1.5)

        // Crystal assembles in from scale 0 (invisible) -> 1.5. Reversible on scroll-up.
        tl.fromTo(this.crystal.mesh.scale,
            { x: 0, y: 0, z: 0 },
            { x: 1.5, y: 1.5, z: 1.5, duration: 1 }, 1.5)

        // Subtle camera dolly across the page.
        tl.to(this.experience.camera.position, { z: 4, duration: 4 }, 0)
    }
```

(Конструктор `World` и метод `update()` — без изменений. Импорты `gsap`/Environment/Particles/
Droplet/Crystal остаются.)

- [ ] **Step 2: Сборка + тесты**

Run: `npm run build && npm test`
Expected: `✓ built`; `13 passed`.

- [ ] **Step 3: Визуальная проверка морфа (вверх и вниз)**

Run: `npm run dev`. Прокрутить hero→услуги и обратно:
- капля плавно сжимается, частицы вспыхивают, кристалл собирается;
- **скролл вверх** возвращает каплю (с возобновлённым дыханием) и убирает кристалл — без «застрявшего»
  кристалла и без рывка scale.y (carry-forward закрыт);
- нет одновременного показа капли и кристалла в полном размере.

- [ ] **Step 4: Commit**

```bash
git add src/webgl/World/World.js
git commit -m "feat(3d): reversible droplet->crystal morph (scale crossfade + particle flash)"
```

---

## Task 7: Debug-панель lil-gui (по `#debug`)

Ручной тюнинг «вау»-параметров без перекомпиляции. lil-gui грузится **динамическим импортом** и
только при `location.hash === '#debug'` — в обычной загрузке панель не создаётся и в основной chunk
не тянется. Параметры: exposure, bloom (strength/radius/threshold), материалы капли/кристалла.

**Files:**
- Create: `src/webgl/Debug.js`
- Modify: `src/webgl/Experience.js`

- [ ] **Step 1: Создать `src/webgl/Debug.js`:**

```js
// Visual tuning panel. Active only when the URL ends with #debug.
// lil-gui is dynamically imported so it stays out of the default bundle path.
export default class Debug {
    constructor(experience) {
        this.experience = experience
        this.active = window.location.hash === '#debug'
        if (!this.active) return

        import('lil-gui').then(({ default: GUI }) => this.build(GUI))
    }

    build(GUI) {
        const gui = new GUI({ title: 'ESTETICAURA — 3D' })
        const { renderer, postProcessing, world } = this.experience

        const rf = gui.addFolder('Renderer')
        rf.add(renderer, 'toneMappingExposure', 0, 3, 0.01)

        if (postProcessing && postProcessing.enabled) {
            const bf = gui.addFolder('Bloom')
            bf.add(postProcessing.bloomPass, 'strength', 0, 2, 0.01)
            bf.add(postProcessing.bloomPass, 'radius', 0, 2, 0.01)
            bf.add(postProcessing.bloomPass, 'threshold', 0, 1, 0.01)
        }

        const df = gui.addFolder('Droplet')
        df.add(world.droplet.material, 'roughness', 0, 0.3, 0.005)
        df.add(world.droplet.material, 'transmission', 0, 1, 0.01)
        df.add(world.droplet.material, 'ior', 1, 2.333, 0.01)
        df.add(world.droplet.material, 'iridescence', 0, 1, 0.01)

        const cf = gui.addFolder('Crystal')
        cf.add(world.crystal.material, 'roughness', 0, 0.5, 0.005)
        cf.add(world.crystal.material, 'metalness', 0, 1, 0.01)
        cf.add(world.crystal.material, 'envMapIntensity', 0, 3, 0.05)
    }
}
```

- [ ] **Step 2: Подключить в `src/webgl/Experience.js`**

(a) Импорт рядом с `import PostProcessing from './PostProcessing.js'`:
```js
import Debug from './Debug.js'
```

(b) Сразу ПОСЛЕ `this.postProcessing = new PostProcessing(this)` добавить:
```js
        this.debug = new Debug(this)
```

- [ ] **Step 3: Сборка + тесты**

Run: `node --check src/webgl/Debug.js && npm run build && npm test`
Expected: ok; `✓ built`; `13 passed`.

- [ ] **Step 4: Проверка гейта**

Run: `npm run dev`. Открыть обычный URL — панели НЕТ. Добавить `#debug` к URL и перезагрузить —
панель lil-gui появляется, ползунки меняют bloom/материалы вживую.

- [ ] **Step 5: Commit**

```bash
git add src/webgl/Debug.js src/webgl/Experience.js
git commit -m "feat(3d): lil-gui debug panel via #debug (dynamic import, tuning bloom + materials)"
```

---

## Task 8: Финальная верификация Фазы C

**Files:** проверки + визуальная приёмка.

- [ ] **Step 1: Полный прогон**

```bash
npm run build   # ✓ built
npm test        # 13 passed (Фаза B не сломана)
node --check src/webgl/PostProcessing.js && node --check src/webgl/Debug.js && echo OK
```

- [ ] **Step 2: Визуальная приёмка (`npm run dev`, десктоп)**

- капля — дорогое стекло с реальными отражениями окружения, лёгкий перламутр, мягкое дыхание;
- золотые частицы — круглые, светятся (bloom), мерцают;
- скролл: капля→вспышка→кристалл; кристалл — гранёное золото с отражениями; **обратимо** вверх;
- bloom мягкий (не пересвет), тон не «выгорел»;
- консоль без ошибок; `#debug` открывает панель тюнинга.

- [ ] **Step 3: (если тюнинговали) зафиксировать параметры**

Если через `#debug` подобраны лучшие значения — вписать их в код (Droplet/Crystal материалы,
`PostProcessing` bloom, exposure) и закоммитить:
```bash
git add -A
git commit -m "tune(3d): apply tuned bloom/material/exposure values"
```
(Если не меняли — шаг пропустить.)

- [ ] **Step 4: Маркер-коммит фазы**

```bash
git commit --allow-empty -m "chore: phase C complete — studio materials, bloom, reversible morph, gold dust"
```

---

## Definition of Done (Фаза C)

- [ ] `npm run build` зелёный; `npm test` — 13 тестов Фазы B по-прежнему проходят.
- [ ] Капля: `transmission:1, thickness:0.5, roughness:0.05, ior:1.33, clearcoat:1, iridescence:0.2`,
      реальные env-отражения; дыхание не конфликтует с морфом.
- [ ] Кристалл: `metalness:1, roughness:0.15, flatShading, envMapIntensity:1.2`; обратимый reveal через scale.
- [ ] Bloom (`UnrealBloomPass 0.4/1.2/0.1`, OutputPass последним) — на десктопе; рендер через EffectComposer.
- [ ] Тон-маппинг ACESFilmic, exposure 1.1.
- [ ] Частицы — круглая золотая пыль (canvas-маска), мягкое мерцание.
- [ ] Морфинг капля→кристалл **обратим** при скролле вверх; carry-forward (дыхание vs tween) закрыт.
- [ ] `#debug` открывает lil-gui (динамический импорт) для тюнинга; в обычной загрузке панели нет.
- [ ] Визуальная приёмка пройдена.

**Следующая фаза:** D — перформанс/адаптив/a11y: динамический импорт Three.js, статичный постер
(mobile/слабый GPU/`prefers-reduced-motion`), отключение ScrollTrigger/параллакса при reduced-motion,
пауза рендера вне вьюпорта. План пишется после приёмки Фазы C.
```
