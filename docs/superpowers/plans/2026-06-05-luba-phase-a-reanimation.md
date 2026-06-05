# Фаза A — Реанимация + чистка скелета (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Привести проект `luba_lending` в собираемое, запускаемое состояние с чистой минимальной
3D-сценой (капля + частицы + env-свет), удалив сломанный и мусорный код.

**Architecture:** Удаляем сломанный `Emblem.js` и зависимость от внешних ассетов (`logo.jpg`).
Env-освещение даёт процедурный `RoomEnvironment` (без файлов) — это же чинит вид стеклянной капли.
`MorphShapes` разбивается на `Droplet`/`Crystal`. `Experience` создаёт `World` синхронно и сигналит
готовность событием, на которое реагирует прелоадер.

**Tech Stack:** Vite 5, vanilla JS (ESM), Three.js r160, GSAP 3.13 (+ ScrollTrigger).

**Спека:** `docs/superpowers/specs/2026-06-05-luba-lending-redesign-design.md`
**Референсы 3D-параметров:** `docs/superpowers/references/2026-06-05-reference-board.md`

> **Про TDD:** Фаза A — это рефакторинг/чистка и рендер-код, для которого юнит-тесты не осмысленны
> («удалить файл», «капля видна»). Верификация каждого шага — **`npm run build`**, запуск
> `npm run dev` и `grep`-проверки. Настоящий TDD начинается в Фазе B (валидация формы).

> **⚠️ Про порядок и сборку:** baseline (`b9d4e04`) уже сломан — `Emblem.js` валит `vite build`.
> Сборка остаётся унаследованно-красной до **Task 3**, который и есть точка восстановления:
> после него и на каждом последующем коммите `npm run build` зелёный. Поэтому новые модули
> создаются первыми (Task 1), затем переключается движок (Task 3), затем удаляются осиротевшие файлы
> (Task 4). Так ни один коммит после Task 3 не ломает сборку.

---

## File Structure (после Фазы A)

```
src/main.js                  изменён: убран AudioPlayer
src/webgl/Experience.js      изменён: RoomEnvironment env, без Resources, синхронный World, событие ready
src/webgl/Environment.js     СОЗДАН: RoomEnvironment (env map) + свет (бывш. Lights)
src/webgl/World/World.js      изменён: без emblem/debug/morphShapes; Droplet+Crystal+Particles+Environment
src/webgl/World/Droplet.js    СОЗДАН: капля (из MorphShapes.createDrop)
src/webgl/World/Crystal.js    СОЗДАН: кристалл (из MorphShapes.createCrystal)
src/webgl/World/Particles.js  без изменений
src/ui/Preloader.js           изменён: готовность по событию 'experience-ready'
src/ui/Cursor.js              без изменений
УДАЛЕНЫ: Emblem.js, MorphShapes.js, Lights.js, Resources.js, AudioPlayer.js, counter.js, javascript.svg
```

---

## Task 1: Создать новые 3D-модули (аддитивно)

Новые файлы пока никем не импортируются — диск меняется, поведение нет. Сборка остаётся
унаследованно-красной (Emblem), это ожидаемо до Task 3.

**Files:**
- Create: `src/webgl/Environment.js`, `src/webgl/World/Droplet.js`, `src/webgl/World/Crystal.js`

- [ ] **Step 1: Создать `src/webgl/Environment.js`**

```js
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

// Procedural image-based lighting (no HDRI file) + key/fill lights.
// Gives real reflections to the glass droplet and gold crystal.
export default class Environment {
    constructor(experience) {
        this.scene = experience.scene
        this.renderer = experience.renderer

        this.setEnvironmentMap()
        this.setLights()
    }

    setEnvironmentMap() {
        const pmrem = new THREE.PMREMGenerator(this.renderer)
        this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
        this.scene.environment = this.envMap
        pmrem.dispose()
    }

    setLights() {
        this.ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
        this.scene.add(this.ambientLight)

        this.directionalLight = new THREE.DirectionalLight('#D4AF37', 2)
        this.directionalLight.position.set(5, 5, 5)
        this.scene.add(this.directionalLight)

        this.spotLight = new THREE.SpotLight('#F7E7CE', 5, 20, Math.PI * 0.3, 0.5, 1)
        this.spotLight.position.set(0, 5, 2)
        this.spotLight.target.position.set(0, 0, 0)
        this.scene.add(this.spotLight)
        this.scene.add(this.spotLight.target)
    }
}
```

- [ ] **Step 2: Создать `src/webgl/World/Droplet.js`**

```js
import * as THREE from 'three'

// Hero object: glass/water droplet. Studio-grade params land in Phase C;
// these are the working baseline carried over from MorphShapes.
export default class Droplet {
    constructor(experience) {
        this.scene = experience.scene

        const geometry = new THREE.SphereGeometry(1, 64, 64)
        const material = new THREE.MeshPhysicalMaterial({
            color: '#ffffff',
            metalness: 0.1,
            roughness: 0,
            transmission: 0.9,
            thickness: 1,
            clearcoat: 1,
            clearcoatRoughness: 0
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.set(0, 0, 0)
        this.scene.add(this.mesh)
    }

    update(elapsedTime) {
        if (!this.mesh.visible) return
        this.mesh.rotation.y = elapsedTime * 0.2
        this.mesh.position.y = Math.sin(elapsedTime) * 0.2
        this.mesh.scale.y = 1 + Math.sin(elapsedTime * 2) * 0.1
    }
}
```

- [ ] **Step 3: Создать `src/webgl/World/Crystal.js`**

```js
import * as THREE from 'three'

// Scroll-target object: faceted gold crystal. Hidden until scroll morph.
export default class Crystal {
    constructor(experience) {
        this.scene = experience.scene

        const geometry = new THREE.IcosahedronGeometry(1, 0)
        const material = new THREE.MeshPhysicalMaterial({
            color: '#F7E7CE',
            metalness: 0.9,
            roughness: 0.1,
            flatShading: true
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.set(0, 0, 0)
        this.mesh.visible = false
        this.scene.add(this.mesh)
    }

    update(elapsedTime) {
        if (!this.mesh.visible) return
        this.mesh.rotation.x = elapsedTime * 0.3
        this.mesh.rotation.y = elapsedTime * 0.3
    }
}
```

- [ ] **Step 4: Проверить синтаксис новых файлов**

Run: `node --check src/webgl/Environment.js && node --check src/webgl/World/Droplet.js && node --check src/webgl/World/Crystal.js && echo OK`
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
cd ~/projects/luba_lending
git add src/webgl/Environment.js src/webgl/World/Droplet.js src/webgl/World/Crystal.js
git commit -m "feat: add Environment (RoomEnvironment IBL + lights), Droplet, Crystal modules"
```

---

## Task 2: Удалить мусор стартера и AudioPlayer

**Files:**
- Delete: `src/counter.js`, `src/javascript.svg`, `src/ui/AudioPlayer.js`
- Modify: `src/main.js`

- [ ] **Step 1: Удалить файлы-мусор и AudioPlayer**

```bash
git rm src/counter.js src/javascript.svg src/ui/AudioPlayer.js
```

- [ ] **Step 2: Полностью заменить `src/main.js`**

```js
import './style.css'
import Experience from './webgl/Experience.js'
import Cursor from './ui/Cursor.js'
import Preloader from './ui/Preloader.js'

const experience = new Experience(document.querySelector('canvas.webgl'))
const cursor = new Cursor()
const preloader = new Preloader(experience)
```

- [ ] **Step 3: Проверить отсутствие висячих ссылок**

Run: `grep -rn "AudioPlayer\|counter\|javascript.svg\|music.mp3" src/ index.html`
Expected: пусто

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove vite starter junk and audio player"
```

---

## Task 3: Переключить движок — переписать Experience / World / Preloader (точка восстановления сборки)

После этой задачи `World.js` больше не импортирует `Emblem`/`MorphShapes`/`Lights`, а `Experience`/
`Preloader` не зависят от `Resources`. Сломанный `Emblem.js` перестаёт быть в графе импорта →
**`npm run build` становится зелёным.**

**Files:**
- Modify: `src/webgl/Experience.js`, `src/webgl/World/World.js`, `src/ui/Preloader.js`

- [ ] **Step 1: Полностью заменить `src/webgl/Experience.js`**

```js
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import World from './World/World.js'

gsap.registerPlugin(ScrollTrigger)

export default class Experience {
    constructor(canvas) {
        window.experience = this
        this.canvas = canvas
        this.ready = false

        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: Math.min(window.devicePixelRatio, 2)
        }

        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color('#050505')
        this.scene.fog = new THREE.Fog('#050505', 10, 50)

        this.camera = new THREE.PerspectiveCamera(35, this.sizes.width / this.sizes.height, 0.1, 100)
        this.camera.position.set(0, 0, 6)
        this.scene.add(this.camera)

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        })
        this.renderer.setSize(this.sizes.width, this.sizes.height)
        this.renderer.setPixelRatio(this.sizes.pixelRatio)
        this.renderer.toneMapping = THREE.ReinhardToneMapping
        this.renderer.toneMappingExposure = 1.5

        this.scrollY = window.scrollY
        this.cursor = { x: 0, y: 0 }

        window.addEventListener('resize', () => this.resize())
        window.addEventListener('mousemove', (e) => {
            this.cursor.x = e.clientX / this.sizes.width - 0.5
            this.cursor.y = e.clientY / this.sizes.height - 0.5
        })
        window.addEventListener('scroll', () => {
            this.scrollY = window.scrollY
        })

        // No external assets to load anymore — build the world synchronously.
        this.world = new World(this)

        this.ready = true
        window.dispatchEvent(new Event('experience-ready'))

        this.clock = new THREE.Clock()
        this.tick()
    }

    resize() {
        this.sizes.width = window.innerWidth
        this.sizes.height = window.innerHeight
        this.sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

        this.camera.aspect = this.sizes.width / this.sizes.height
        this.camera.updateProjectionMatrix()

        this.renderer.setSize(this.sizes.width, this.sizes.height)
        this.renderer.setPixelRatio(this.sizes.pixelRatio)
    }

    tick() {
        const elapsedTime = this.clock.getElapsedTime()

        if (this.world) {
            this.world.update(elapsedTime)
        }

        const parallaxX = this.cursor.x * 0.5
        const parallaxY = -this.cursor.y * 0.5
        this.camera.position.x += (parallaxX - this.camera.position.x) * 0.05
        this.camera.position.y += (parallaxY - this.camera.position.y) * 0.05

        this.renderer.render(this.scene, this.camera)
        window.requestAnimationFrame(() => this.tick())
    }
}
```

- [ ] **Step 2: Полностью заменить `src/webgl/World/World.js`**

```js
import Environment from '../Environment.js'
import Particles from './Particles.js'
import Droplet from './Droplet.js'
import Crystal from './Crystal.js'
import gsap from 'gsap'

export default class World {
    constructor(experience) {
        this.experience = experience
        this.scene = this.experience.scene

        // Environment first — sets scene.environment used by PBR materials.
        this.environment = new Environment(this.experience)
        this.particles = new Particles(this.experience)
        this.droplet = new Droplet(this.experience)
        this.crystal = new Crystal(this.experience)

        this.setupScrollAnimations()
    }

    update(elapsedTime) {
        if (this.droplet) this.droplet.update(elapsedTime)
        if (this.crystal) this.crystal.update(elapsedTime)
        if (this.particles) this.particles.update(elapsedTime)
    }

    setupScrollAnimations() {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1
            }
        })

        // Hero -> Services: droplet shrinks out, crystal scales in.
        tl.to(this.droplet.mesh.scale, { x: 0, y: 0, z: 0, duration: 1 }, 1)
        tl.call(() => {
            this.droplet.mesh.visible = false
            this.crystal.mesh.visible = true
        }, null, 1.5)
        tl.fromTo(this.crystal.mesh.scale,
            { x: 0, y: 0, z: 0 },
            { x: 1.5, y: 1.5, z: 1.5, duration: 1 }, 1.5)

        // Subtle camera dolly across the page.
        tl.to(this.experience.camera.position, { z: 4, duration: 4 }, 0)
    }
}
```

- [ ] **Step 3: Обновить готовность в `src/ui/Preloader.js`**

Заменить блок конструктора (от `this.experience = experience` до закрывающей `}` блока готовности —
текущие строки 4–32, заканчивающиеся `setTimeout(... 5000)`) на:

```js
        this.experience = experience

        this.overlay = document.createElement('div')
        this.overlay.classList.add('preloader')
        this.overlay.innerHTML = `
            <div class="preloader-content">
                <div class="preloader-logo">ESTETICAURA</div>
                <div class="preloader-bar-container">
                    <div class="preloader-bar"></div>
                </div>
            </div>
        `
        document.body.appendChild(this.overlay)

        this.addStyles()

        // World is built synchronously — experience may already be ready.
        if (this.experience.ready) {
            this.hide()
        } else {
            window.addEventListener('experience-ready', () => this.hide(), { once: true })
        }

        // Safety fallback in case the ready signal never fires.
        setTimeout(() => {
            if (document.querySelector('.preloader')) {
                this.hide()
            }
        }, 4000)
```

(Методы `addStyles()` и `hide()` ниже остаются без изменений; `import gsap` в строке 1 сохраняется.)

- [ ] **Step 4: Сборка должна стать зелёной**

Run: `npm run build`
Expected: `✓ built in ...` без ошибок (впервые после baseline)

- [ ] **Step 5: Проверить, что Preloader не зависит от resources**

Run: `grep -n "resources" src/ui/Preloader.js`
Expected: пусто

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: switch engine to Droplet/Crystal/Environment, drop Resources dependency"
```

---

## Task 4: Удалить осиротевшие файлы

После Task 3 `Emblem`/`MorphShapes`/`Lights`/`Resources` больше не импортируются — удаляем их.
Сборка остаётся зелёной (vite не трогает неимпортируемые модули, а теперь их и на диске нет).

**Files:**
- Delete: `src/webgl/World/Emblem.js`, `src/webgl/World/MorphShapes.js`,
  `src/webgl/World/Lights.js`, `src/webgl/Resources.js`

- [ ] **Step 1: Удалить осиротевшие модули**

```bash
git rm src/webgl/World/Emblem.js src/webgl/World/MorphShapes.js src/webgl/World/Lights.js src/webgl/Resources.js
```

- [ ] **Step 2: Сборка всё ещё зелёная**

Run: `npm run build`
Expected: `✓ built in ...` без ошибок

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove orphaned Emblem/MorphShapes/Lights/Resources"
```

---

## Task 5: Финальная верификация Фазы A

**Files:** нет изменений — только проверки.

- [ ] **Step 1: Чистота — удалённое нигде не упоминается**

Run: `grep -rn "Emblem\|MorphShapes\|Lights\|Resources\|AudioPlayer\|debugCube\|logo.jpg\|music.mp3" src/ index.html`
Expected: пусто

- [ ] **Step 2: Файловая структура соответствует плану**

Run: `find src -type f | sort`
Expected:
```
src/main.js
src/style.css
src/ui/Cursor.js
src/ui/Preloader.js
src/webgl/Environment.js
src/webgl/Experience.js
src/webgl/World/Crystal.js
src/webgl/World/Droplet.js
src/webgl/World/Particles.js
src/webgl/World/World.js
```

- [ ] **Step 3: Dev-сервер запускается, сцена рендерит**

Run: `npm run dev` (открыть указанный localhost-URL в браузере)
Expected (визуально):
- прелоадер мелькает и исчезает;
- видна стеклянная капля по центру на чёрном фоне с золотыми бликами окружения;
- золотые частицы;
- при скролле капля уменьшается, появляется золотой кристалл;
- нет красного wireframe-куба;
- в консоли браузера нет ошибок.

- [ ] **Step 4: Финальный коммит-маркер фазы**

```bash
git commit --allow-empty -m "chore: phase A complete — build green, clean minimal 3D scene"
```

---

## Definition of Done (Фаза A)

- [ ] `npm run build` проходит без ошибок (с Task 3 включительно).
- [ ] `npm run dev` показывает рабочую сцену: капля + частицы + env-свет, морфинг в кристалл по скроллу.
- [ ] Удалены: `Emblem.js`, `MorphShapes.js`, `Lights.js`, `Resources.js`, `AudioPlayer.js`,
      `counter.js`, `javascript.svg`, debug-куб.
- [ ] Нет зависимостей от отсутствующих ассетов (`logo.jpg`, `music.mp3`).
- [ ] Прелоадер корректно скрывается без `Resources`.
- [ ] Создан задел под Фазу C: `Environment.js` (env map), `Droplet.js`, `Crystal.js`.

**Следующая фаза:** B — дизайн-система + русский контент 8 секций + форма записи (TDD).
План пишется после завершения и проверки Фазы A.
