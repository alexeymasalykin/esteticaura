# Фаза D — Перформанс / адаптив / a11y (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать тяжёлый Three.js из критического пути загрузки и отдать его адаптивно: на десктопе
с движением — динамический импорт WebGL после первого рендера; на mobile / при
`prefers-reduced-motion` / без WebGL — статичный золотой постер (Three.js не качается вообще), без
ScrollTrigger-хореографии и параллакса; пауза рендера при скрытой вкладке.

**Architecture:** Решение «3D или постер» принимает чистая функция `decideMode` (TDD) на основе
`prefers-reduced-motion`, mobile/coarse-pointer и наличия WebGL. `main.js` либо **динамически
импортирует** `Experience.js` после первого пейнта (Three.js уходит в ленивый chunk → меньше main
bundle, hero виден сразу), либо включает постер и сразу освобождает прелоадер. Прелоадер теперь
скрывается **только по событию** `experience-ready` (в постер-режиме событие шлёт `main.js`) —
это и есть «оживший» событийный путь из carry-forward Фазы A. На mobile/reduced-motion 3D не
грузится → ScrollTrigger-хореография и параллакс камеры/курсора там не выполняются автоматически.

**Tech Stack:** Vite 5 (code-splitting через `import()`), Three.js r160, GSAP, Vitest.
**Новых зависимостей нет.**

**Спека:** §6 (перформанс/адаптив/доступность). **Carry-forward:**
`docs/superpowers/notes/phase-a-review-carryforward.md` (событийная ветка прелоадера → оживает здесь).

> **Про TDD:** чистое решение режима (`decideMode`) — по TDD (Vitest). Остальное (динамический импорт,
> постер-CSS, пауза по visibility) — интеграция/рендер, верификация через `npm run build` (проверяем,
> что Three.js стал отдельным ленивым chunk и main bundle уменьшился), `npm test` и Playwright
> (3D на десктопе; постер при reduced-motion/mobile).

## Граница / решения
- **Mobile = постер** (Three.js не качается) — по спеке §6 (бюджет лендинга). Брейкпоинт `≤768px`
  или `pointer:coarse`.
- **Пауза рендера**: канвас — фиксированный полноэкранный фон, всегда во вьюпорте, поэтому
  `IntersectionObserver` по канвасу бессмыслен. Практический эквивалент из спеки — **пауза при
  скрытой вкладке** (Page Visibility API). Реализуем его.
- `prefers-reduced-motion` → постер (3D не грузится) ⇒ ScrollTrigger/параллакс там не работают;
  CSS-reduced-motion (глушение `shine`/transition) уже сделан в Фазе B.

## Инвариант сборки
Зелёная сейчас. Остаётся зелёной на каждом коммите. `npm test` (13 тестов) не ломаем, добавляем
тесты `decideMode`. Порядок задач не ломает сборку между коммитами (Preloader игнорирует лишний
аргумент до того, как `main.js` перестанет его передавать).

---

## File Structure (после Фазы D)

```
src/webgl/capabilities.js        СОЗДАН: decideMode (чистая, TDD) + prefersReducedMotion/isMobile/hasWebGL/shouldRender3D
src/webgl/capabilities.test.js   СОЗДАН: Vitest к decideMode
index.html                       изменён: добавлен <div class="scene-poster">
src/style.css                    изменён (append): .scene-poster (градиент+зерно), body.no-3d правила
src/ui/Preloader.js              изменён: без аргумента experience, скрытие только по событию
src/main.js                      изменён: capability-gate + динамический import Experience после пейнта
src/webgl/Experience.js          изменён: пауза tick при скрытой вкладке (Page Visibility)
```

---

## Task 1: `capabilities.js` — решение режима (TDD)

Чистая функция `decideMode` + тонкие DOM-обёртки. По TDD пишем `decideMode`.

**Files:**
- Create: `src/webgl/capabilities.js`, `src/webgl/capabilities.test.js`

- [ ] **Step 1: Написать падающие тесты `src/webgl/capabilities.test.js`:**

```js
import { describe, it, expect } from 'vitest'
import { decideMode } from './capabilities.js'

describe('decideMode', () => {
    it('renders 3d only on a capable, motion-OK, non-mobile device', () => {
        expect(decideMode({ reducedMotion: false, mobile: false, webgl: true })).toBe('3d')
    })
    it('falls back to poster when reduced motion is requested', () => {
        expect(decideMode({ reducedMotion: true, mobile: false, webgl: true })).toBe('poster')
    })
    it('falls back to poster on mobile', () => {
        expect(decideMode({ reducedMotion: false, mobile: true, webgl: true })).toBe('poster')
    })
    it('falls back to poster when WebGL is unavailable', () => {
        expect(decideMode({ reducedMotion: false, mobile: false, webgl: false })).toBe('poster')
    })
})
```

- [ ] **Step 2: Запустить — падает**

Run: `npm test`
Expected: FAIL (`Failed to resolve import './capabilities.js'`).

- [ ] **Step 3: Реализовать `src/webgl/capabilities.js`:**

```js
// Decide whether to load the heavy WebGL scene or show the static poster.
// decideMode is pure (unit-tested); the wrappers below read the live environment.

export function decideMode({ reducedMotion, mobile, webgl }) {
    if (reducedMotion || mobile || !webgl) return 'poster'
    return '3d'
}

export function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isMobile() {
    return window.matchMedia('(max-width: 768px), (pointer: coarse)').matches
}

export function hasWebGL() {
    try {
        const canvas = document.createElement('canvas')
        return !!(window.WebGLRenderingContext &&
            (canvas.getContext('webgl2') || canvas.getContext('webgl')))
    } catch (e) {
        return false
    }
}

export function shouldRender3D() {
    return decideMode({
        reducedMotion: prefersReducedMotion(),
        mobile: isMobile(),
        webgl: hasWebGL()
    }) === '3d'
}
```

- [ ] **Step 4: Тесты проходят + сборка**

Run: `npm test && npm run build`
Expected: все тесты PASS (13 + 4 = 17); `✓ built`.

- [ ] **Step 5: Commit**

```bash
git add src/webgl/capabilities.js src/webgl/capabilities.test.js
git commit -m "feat(perf): capability decision (decideMode) for 3d-vs-poster (TDD)"
```

---

## Task 2: Статичный постер (золотой градиент + зерно)

Постер показывается, когда 3D не грузится (`body.no-3d`): фиксированный фон с радиальным золотым
свечением + лёгкое зерно. Канвас в этом режиме прячется.

**Files:**
- Modify: `index.html` (добавить элемент), `src/style.css` (append)

- [ ] **Step 1: Добавить элемент постера в `index.html`** — сразу ПОСЛЕ `<canvas class="webgl"></canvas>`:

```html
    <div class="scene-poster" aria-hidden="true"></div>
```

- [ ] **Step 2: Дописать в конец `src/style.css`:**

```css
/* ===== Static poster (shown when WebGL is not loaded: mobile / reduced-motion / no GPU) ===== */
.scene-poster {
    position: fixed;
    inset: 0;
    z-index: -1;
    display: none;
    background:
        radial-gradient(ellipse 60% 50% at 50% 38%, rgba(212, 175, 55, .22), rgba(212, 175, 55, .05) 42%, transparent 70%),
        radial-gradient(circle at 50% 42%, rgba(247, 231, 206, .10), transparent 55%),
        var(--bg);
}
.scene-poster::after {
    content: '';
    position: absolute;
    inset: 0;
    opacity: .35;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 160px 160px;
}

body.no-3d .scene-poster { display: block; }
body.no-3d canvas.webgl { display: none; }

@media (prefers-reduced-motion: reduce) {
    .scene-poster::after { display: none; } /* keep it perfectly still */
}
```

- [ ] **Step 3: Сборка**

Run: `npm run build`
Expected: `✓ built`.

- [ ] **Step 4: Commit**

```bash
git add index.html src/style.css
git commit -m "feat(perf): static golden poster for no-WebGL mode (gradient + grain)"
```

---

## Task 3: `Preloader.js` — скрытие только по событию

Убираем аргумент `experience` и проверку `experience.ready` (3D теперь грузится асинхронно/не
грузится вовсе). Прелоадер скрывается по событию `experience-ready` + таймаут-страховка. В
постер-режиме событие шлёт `main.js` (Task 4).

**Files:**
- Modify: `src/ui/Preloader.js`

- [ ] **Step 1: Заменить конструктор `Preloader`** (текущие строки 4–32) на:

```js
    constructor() {
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

        // The 3D scene now loads asynchronously (or not at all). Hide on the ready signal;
        // in poster mode main.js dispatches 'experience-ready' itself.
        window.addEventListener('experience-ready', () => this.hide(), { once: true })

        // Safety fallback in case the ready signal never fires.
        setTimeout(() => {
            if (document.querySelector('.preloader')) {
                this.hide()
            }
        }, 4000)
    }
```

(`import gsap` строка 1 и метод `hide()` — без изменений.)

- [ ] **Step 2: Проверка**

Run: `grep -n "experience" src/ui/Preloader.js; node --check src/ui/Preloader.js && echo OK`
Expected: grep ничего не печатает (нет ссылок на `experience`); затем `OK`.

- [ ] **Step 3: Сборка + тесты**

Run: `npm run build && npm test`
Expected: `✓ built`; `17 passed`. (main.js пока ещё передаёт лишний аргумент — JS его игнорирует, сборка цела.)

- [ ] **Step 4: Commit**

```bash
git add src/ui/Preloader.js
git commit -m "refactor(preloader): event-only hide (async/poster ready), drop experience arg"
```

---

## Task 4: `main.js` — capability-gate + динамический импорт

Главная задача фазы: либо динамически импортируем `Experience.js` после первого пейнта (Three.js
уходит в ленивый chunk), либо включаем постер и шлём `experience-ready`.

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Полностью заменить `src/main.js` на:**

```js
import './style.css'
import Cursor from './ui/Cursor.js'
import Preloader from './ui/Preloader.js'
import Nav from './ui/Nav.js'
import BookingForm from './ui/BookingForm.js'
import BeforeAfter from './ui/BeforeAfter.js'
import { shouldRender3D } from './webgl/capabilities.js'

// UI is lightweight — always on.
new Cursor()
new Nav()
new BookingForm()
new BeforeAfter()
new Preloader()

if (shouldRender3D()) {
    // Load the heavy Three.js scene only AFTER the first paint, so the hero shows instantly
    // and Three.js sits in a lazy chunk off the critical path.
    const boot = () =>
        import('./webgl/Experience.js').then(({ default: Experience }) => {
            new Experience(document.querySelector('canvas.webgl'))
        })
    if ('requestIdleCallback' in window) {
        requestIdleCallback(boot, { timeout: 1500 })
    } else {
        window.setTimeout(boot, 200)
    }
} else {
    // Poster mode: no WebGL download. Show the static poster and release the preloader.
    document.body.classList.add('no-3d')
    window.dispatchEvent(new Event('experience-ready'))
}
```

- [ ] **Step 2: Three.js стал отдельным ленивым chunk; main bundle уменьшился**

Run: `npm run build`
Expected: `✓ built`. В выводе появляется ОТДЕЛЬНЫЙ крупный chunk (Three.js, ~0.5–0.6 MB) помимо
основного `index-*.js`, а основной entry заметно меньше прежних ~600 kB. (Точные имена/размеры —
информативно; ключевое: Three.js больше не в main entry.)

- [ ] **Step 3: Тесты + dev-проверка**

Run: `npm test`
Expected: `17 passed`.
Затем `npm run dev` (десктоп): прелоадер уходит, сцена догружается через мгновение, бриллиант-из-пыли
работает; в консоли нет ошибок.

- [ ] **Step 4: Commit**

```bash
git add src/main.js
git commit -m "feat(perf): dynamic-import Three.js after first paint; poster fallback (mobile/reduced-motion/no-GPU)"
```

---

## Task 5: `Experience.js` — пауза рендера при скрытой вкладке

Page Visibility: при скрытой вкладке останавливаем RAF-цикл, при возврате — продолжаем.

**Files:**
- Modify: `src/webgl/Experience.js`

- [ ] **Step 1: Инициализировать флаг паузы** — в конструкторе, сразу ПОСЛЕ `this.ready = false`
(текущая строка 14), добавить:

```js
        this.paused = false
```

- [ ] **Step 2: Добавить слушатель visibility** — в блоке `window.addEventListener('scroll', …)`
рядом с другими слушателями (после строки со `scroll`-листенером, перед `// No external assets…`),
добавить:

```js
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.paused = true
            } else if (this.paused) {
                this.paused = false
                this.tick()
            }
        })
```

- [ ] **Step 3: Ранний выход из `tick()`** — самой первой строкой внутри `tick()` (перед
`const elapsedTime = …`) добавить:

```js
        if (this.paused) return
```

- [ ] **Step 4: Проверка + сборка + тесты**

Run: `node --check src/webgl/Experience.js && npm run build && npm test`
Expected: ok; `✓ built`; `17 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/webgl/Experience.js
git commit -m "perf(3d): pause render loop while the tab is hidden (Page Visibility)"
```

---

## Task 6: Финальная верификация Фазы D

**Files:** проверки + маркер.

- [ ] **Step 1: Полный прогон**

```bash
npm run build   # ✓ built; Three.js — отдельный ленивый chunk
npm test        # 17 passed
```

- [ ] **Step 2: Bundle — Three.js вне критического пути**

Run: `npm run build` и посмотреть список chunk'ов.
Expected: основной `index-*.js` существенно меньше (UI+GSAP), Three.js — в отдельном лениво
подгружаемом chunk. Зафиксировать наблюдаемые размеры в отчёте.

- [ ] **Step 3: Playwright — десктоп (3D грузится)**

Поднять `npm run dev`, снять сцену скриптом из `/tmp/luba_seq.mjs` (viewport 1440×900). Убедиться:
поле пыли → сборка бриллианта по скроллу работает; консоль чистая.

- [ ] **Step 4: Постер при reduced-motion / mobile**

Проверить постер-режим (любой из способов):
- эмуляция `prefers-reduced-motion: reduce` (Playwright `page.emulateMedia({ reducedMotion: 'reduce' })`) → `body.no-3d`, виден золотой постер, канваса нет, в Network нет загрузки большого Three-chunk;
- mobile-viewport (≤768px) → то же.
Снять скриншот постера, убедиться, что hero-текст читается поверх него.

- [ ] **Step 5: a11y — reduced-motion глушит хореографию**

Подтвердить: при reduced-motion 3D не грузится (нет ScrollTrigger/параллакса); CSS-анимации
(`shine`) заглушены (Фаза B). Бургер/форма/слайдер работают.

- [ ] **Step 6: Маркер-коммит фазы**

```bash
git commit --allow-empty -m "chore: phase D complete — dynamic 3D import, poster fallback, reduced-motion + visibility perf"
```

---

## Definition of Done (Фаза D)

- [ ] `npm run build` зелёный; `npm test` — 17 тестов (13 + 4 `decideMode`).
- [ ] Three.js грузится **динамическим импортом** после первого пейнта (отдельный chunk, main bundle
      меньше); hero виден сразу.
- [ ] На mobile / `prefers-reduced-motion` / без WebGL — **статичный золотой постер**, Three.js не
      качается; `body.no-3d` прячет канвас.
- [ ] При `prefers-reduced-motion` 3D не грузится ⇒ ScrollTrigger-хореография и параллакс отключены;
      CSS-motion (`shine`) заглушён; бургер/форма/слайдер работают.
- [ ] Рендер встаёт на паузу при скрытой вкладке (Page Visibility).
- [ ] Прелоадер скрывается по событию `experience-ready` (carry-forward закрыт).
- [ ] Постер проверен визуально; hero-текст читается поверх.

**Это последняя фаза Подхода A.** После приёмки — лендинг функционально завершён: рабочая сборка,
дизайн-система, русский контент 8 секций, форма, 3D «бриллиант-из-пыли», перформанс/адаптив/a11y.
Дальнейшее (реальный контент/изображения, бэкенд формы, deploy) — вне этого скоупа.
```
