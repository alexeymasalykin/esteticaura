# Фаза B — Дизайн-система + русский контент 8 секций + форма (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Превратить минимальную рабочую сцену Фазы A в полноценный лендинг ESTETICAURA Love:
дизайн-система золото-нуар в `style.css`, русский контент всех 8 секций в `index.html` без единого
inline-стиля, рабочая форма записи с валидацией на blur и отправкой в Telegram, бургер-навигация,
слайдер «до/после», desktop-only курсор.

**Architecture:** Дизайн-система — на CSS-переменных (`:root`), без фреймворка. UI-логика — vanilla-JS
классы в `src/ui/` (паттерн «инстанцируй в `main.js`»). Чистая логика (валидаторы, построение
Telegram-ссылки, clamp слайдера) выносится в `src/ui/validation.js` / `src/ui/slider.js` как
тестируемые функции и покрывается Vitest (TDD). DOM-обвязка (`BookingForm`, `Nav`, `BeforeAfter`) —
ручная/визуальная верификация. 3D-сцена Фазы A не трогается.

**Tech Stack:** Vite 5, vanilla JS (ESM), GSAP 3.13 (уже есть), **Vitest** (новое, dev-only).

**Спека:** `docs/superpowers/specs/2026-06-05-luba-lending-redesign-design.md` (разделы 3, 4, 6, 7).
**Дизайн-токены — источник истины:** спека §3 и `CLAUDE.md`. НЕ выдумывать значения мимо токенов.

---

## Решения, зафиксированные с заказчиком (2026-06-05)
- **Канал заявки:** Telegram. Отправка — `https://t.me/share/url?...` с предзаполненным текстом заявки;
  прямой `@username` студии дублируется в контактах. Username/URL — свапаемые константы.
- **До/после:** интерактивный слайдер (`BeforeAfter.js`) включён в Фазу B.
- **Контент:** осмысленные RU-заглушки (цены, телефон, адрес, соцсети, отзывы) — помечены
  комментарием `<!-- TODO: replace with real data -->`, подставляются позже без смены структуры.

## Граница фазы (что НЕ здесь)
- Динамический импорт Three.js, статичный постер, JS-детект GPU, **отключение ScrollTrigger при
  `prefers-reduced-motion`**, пауза рендера по `IntersectionObserver` — это **Фаза D**.
- Bloom/материалы/морфинг-crossfade/золотая пыль — **Фаза C** (см.
  `docs/superpowers/notes/phase-a-review-carryforward.md`).
- В Фазе B `prefers-reduced-motion` обрабатывается **только на уровне CSS** (глушим `shine`-анимацию
  заголовка и `scroll-behavior:smooth`); hover-переходы остаются.

---

## Инвариант сборки
Сборка сейчас зелёная (конец Фазы A). Она ОБЯЗАНА оставаться зелёной на каждом коммите.
Поэтому новые UI-модули (`Nav`, `BookingForm`, `BeforeAfter`) создаются раньше, а импортируются в
`main.js` последней задачей (Task 12) — пока модуль не импортирован, Vite его не парсит, сборка цела.
Проверка после задач, меняющих JS/HTML/CSS: `npm run build` → `✓ built`.

---

## File Structure (после Фазы B)

```
package.json                 изменён: devDep vitest, скрипт "test"
index.html                   изменён: lang=ru, 8 RU-секций, 0 inline-стилей, favicon, бургер, форма
public/favicon.svg           СОЗДАН: золотая монограмма «E» (замена vite.svg)
public/vite.svg              УДАЛЁН
src/style.css                изменён: полная дизайн-система (токены, типографика, кнопки, секции,
                                       nav/бургер, форма, слайдер, адаптив, reduced-motion)
src/ui/validation.js         СОЗДАН: чистые валидаторы + построение текста/ссылки Telegram (TDD)
src/ui/validation.test.js    СОЗДАН: Vitest-юниты к validation.js
src/ui/slider.js             СОЗДАН: чистый clamp/percent для слайдера (TDD)
src/ui/slider.test.js        СОЗДАН: Vitest-юниты к slider.js
src/ui/BookingForm.js        СОЗДАН: обвязка формы (blur-валидация, состояния, submit в Telegram)
src/ui/Nav.js                СОЗДАН: бургер, smooth-scroll, active-link, scroll-lock
src/ui/BeforeAfter.js        СОЗДАН: интерактивный слайдер до/после (использует slider.js)
src/ui/Cursor.js             изменён: media-гард (только desktop)
src/ui/Preloader.js          изменён: inline-стили перенесены в style.css
src/main.js                  изменён: инстанцирование Nav + BookingForm + BeforeAfter
```

---

## Task 1: Тест-инфраструктура (Vitest)

Чистая логика Фазы B (валидаторы, Telegram-URL, clamp слайдера) пишется по TDD. Нужен раннер.
Vitest — нативен для Vite, без отдельного конфига (берёт `vite.config`/дефолты), окружение `node`
(валидаторы чистые, DOM не нужен).

**Files:**
- Modify: `package.json`
- Create: `src/ui/smoke.test.js` (временный, удаляется в этой же задаче)

- [ ] **Step 1: Установить Vitest (dev-only)**

Run: `npm install -D vitest`
Expected: добавлен `vitest` в `devDependencies`, без ошибок.

- [ ] **Step 2: Добавить скрипт `test` в `package.json`**

В блок `"scripts"` добавить строку `"test": "vitest run"` (рядом с `dev`/`build`/`preview`).
Результат — блок выглядит так:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
```

- [ ] **Step 3: Написать смоук-тест, чтобы убедиться, что раннер работает**

Create `src/ui/smoke.test.js`:

```js
import { describe, it, expect } from 'vitest'

describe('vitest smoke', () => {
    it('runs', () => {
        expect(1 + 1).toBe(2)
    })
})
```

- [ ] **Step 4: Запустить тесты — должны пройти**

Run: `npm test`
Expected: `1 passed` (1 test), exit 0.

- [ ] **Step 5: Удалить смоук-тест и убедиться, что сборка цела**

```bash
git rm -f src/ui/smoke.test.js 2>/dev/null || rm src/ui/smoke.test.js
npm run build
```
Expected build: `✓ built` без ошибок. (Vitest в graph сборки не входит — vite билдит как раньше.)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add vitest test runner"
```

---

## Task 2: Дизайн-система — фундамент `style.css`

Полная замена `src/style.css`. Заводим токены спеки §3, ресет, базовую типографику (clamp-шкала),
две иерархии кнопок, фокус-стейты, reduced-motion (CSS-уровень), scrollbar. Компонентные/секционные
стили добавляются в Task 3 (тот же файл, append).

**Files:**
- Modify: `src/style.css` (полная замена содержимого)

- [ ] **Step 1: Полностью заменить `src/style.css` на:**

```css
/* ===== ESTETICAURA Love — Design System (golden-noir) =====
   Источник истины токенов: спека §3. Не выдумывать значения мимо токенов. */
:root {
    /* color */
    --bg: #050505;
    --surface: #0E0E0F;
    --surface-hi: #16161A;
    --gold: #D4AF37;
    --gold-light: #F7E7CE;
    --gold-dark: #8A6E2F;
    --text: #F5F3EE;
    --text-muted: rgba(245, 243, 238, .66);
    --text-faint: rgba(245, 243, 238, .55);
    --border: rgba(212, 175, 55, .18);
    --border-strong: rgba(212, 175, 55, .45);
    --danger: #E5867A;

    /* typography */
    --font-heading: 'Playfair Display', serif;
    --font-body: 'Inter', sans-serif;
    --fs-display: clamp(3rem, 8vw, 7rem);
    --fs-h1: clamp(2.2rem, 5vw, 3.5rem);
    --fs-h2: clamp(1.5rem, 3vw, 2.2rem);
    --fs-h3: clamp(1.1rem, 2vw, 1.4rem);
    --fs-body: 1.05rem;
    --fs-caption: 0.8rem;

    /* spacing (8px scale) */
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 16px;
    --space-4: 24px;
    --space-5: 40px;
    --space-6: 64px;
    --space-7: 96px;
    --space-8: 128px;

    /* radii */
    --radius-sm: 8px;
    --radius: 16px;
    --radius-lg: 24px;
    --radius-pill: 999px;

    /* shadow / glow */
    --shadow-card: 0 20px 40px rgba(0, 0, 0, .5);
    --glow-gold: 0 0 24px rgba(212, 175, 55, .35);

    /* motion */
    --dur-fast: 150ms;
    --dur: 250ms;
    --ease-out: cubic-bezier(.16, 1, .3, 1);

    /* z-index layers */
    --z-content: 10;
    --z-nav: 100;
    --z-cursor: 9998;
    --z-preloader: 10000;
}

*,
*::before,
*::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    background: var(--bg);
    scroll-behavior: smooth;
}

body {
    background: transparent; /* WebGL canvas (z-index:-1) показывается сквозь body */
    color: var(--text);
    font-family: var(--font-body);
    font-size: var(--fs-body);
    line-height: 1.6;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
}

canvas.webgl {
    position: fixed;
    top: 0;
    left: 0;
    outline: none;
    z-index: -1;
}

h1, h2, h3 {
    font-family: var(--font-heading);
    font-weight: 700;
    line-height: 1.1;
    color: var(--gold-light);
}

p {
    color: var(--text);
}

a {
    color: var(--gold);
    text-decoration: none;
}

/* Числа: цены и мета-цифры — без дёргания ширины */
.tabular {
    font-variant-numeric: tabular-nums;
}

.caption {
    font-size: var(--fs-caption);
    text-transform: uppercase;
    letter-spacing: .15em;
    color: var(--text-faint);
}

/* ===== Buttons — две иерархии ===== */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: var(--space-2) var(--space-5);
    border-radius: var(--radius-pill);
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: .12em;
    cursor: pointer;
    background: var(--gold);
    color: var(--bg);
    border: 1px solid var(--gold);
    transition: transform var(--dur) var(--ease-out),
                box-shadow var(--dur) var(--ease-out),
                background var(--dur) var(--ease-out),
                color var(--dur) var(--ease-out);
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--glow-gold);
}

.btn--ghost {
    background: transparent;
    color: var(--gold);
    border: 1px solid var(--border-strong);
}

.btn--ghost:hover {
    background: var(--gold);
    color: var(--bg);
}

.btn:disabled {
    opacity: .6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

/* ===== Focus states (a11y) ===== */
:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 3px;
    border-radius: var(--radius-sm);
}

/* ===== Scrollbar ===== */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--gold-dark); border-radius: 4px; }

/* ===== Reduced motion (CSS-уровень; JS/3D-гейтинг — Фаза D) ===== */
@media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *,
    *::before,
    *::after {
        animation-duration: .001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: var(--dur-fast) !important; /* hover-переходы остаются короткими */
    }
}
```

- [ ] **Step 2: Сборка цела**

Run: `npm run build`
Expected: `✓ built` без ошибок.

- [ ] **Step 3: Commit**

```bash
git add src/style.css
git commit -m "feat(style): design-system foundation — tokens, typography, buttons, focus, reduced-motion"
```

---

## Task 3: Компонентные и секционные стили (append в `style.css`)

Добавляем (дописываем В КОНЕЦ файла) стили навигации/бургера, секций, карточек на `--surface`,
мета-строки, сетки услуг, блока доверия (слайдер + отзывы), формы, контактов, футера, адаптива.
Контраст по правилу спеки: золото — только крупный текст; body/подписи — `--text`/`--text-muted`.

**Files:**
- Modify: `src/style.css` (append)

- [ ] **Step 1: Дописать в конец `src/style.css`:**

```css
/* ===== Layout / sections ===== */
.section {
    position: relative;
    z-index: var(--z-content);
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-8) var(--space-4);
}

.section__caption {
    font-size: var(--fs-caption);
    text-transform: uppercase;
    letter-spacing: .15em;
    color: var(--gold);
    margin-bottom: var(--space-3);
}

.section__title {
    font-size: var(--fs-h1);
    margin-bottom: var(--space-5);
}

/* ===== Navigation ===== */
.nav {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: var(--z-nav);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3) var(--space-5);
    mix-blend-mode: difference;
}

.nav__logo {
    font-family: var(--font-heading);
    font-size: 1.4rem;
    letter-spacing: .05em;
    color: #fff;
}

.nav__links {
    display: flex;
    align-items: center;
    gap: var(--space-5);
}

.nav__link {
    font-size: var(--fs-caption);
    text-transform: uppercase;
    letter-spacing: .12em;
    color: #fff;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
}

.nav__link.is-active { color: var(--gold); }

.nav__burger {
    display: none;
    width: 44px;
    height: 44px;
    background: none;
    border: none;
    cursor: pointer;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    padding: 0;
}

.nav__burger span {
    display: block;
    width: 24px;
    height: 2px;
    margin: 0 auto;
    background: #fff;
    transition: transform var(--dur) var(--ease-out), opacity var(--dur) var(--ease-out);
}

.nav__burger.is-open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.nav__burger.is-open span:nth-child(2) { opacity: 0; }
.nav__burger.is-open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* ===== Hero ===== */
.hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    position: relative;
    z-index: var(--z-content);
    padding: var(--space-5);
}

.hero__title {
    font-size: var(--fs-display);
    text-transform: uppercase;
    letter-spacing: .08em;
    background: linear-gradient(to right, var(--gold-light), var(--gold), var(--gold-light));
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shine 6s linear infinite;
}

.hero__subtitle {
    font-size: var(--fs-h3);
    color: var(--text-muted);
    margin-top: var(--space-3);
    font-family: var(--font-body);
}

.hero__actions {
    display: flex;
    gap: var(--space-3);
    margin-top: var(--space-5);
    flex-wrap: wrap;
    justify-content: center;
}

@keyframes shine {
    to { background-position: 200% center; }
}

@media (prefers-reduced-motion: reduce) {
    .hero__title { animation: none; }
}

/* ===== About + meta row ===== */
.about__lead {
    max-width: 640px;
    color: var(--text-muted);
    font-size: var(--fs-h3);
    line-height: 1.6;
}

.meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-6);
    margin-top: var(--space-6);
}

.meta__item { display: flex; flex-direction: column; gap: var(--space-1); }
.meta__num {
    font-family: var(--font-heading);
    font-size: var(--fs-h2);
    color: var(--gold); /* крупное → 3:1 допустимо */
}
.meta__label { font-size: var(--fs-caption); text-transform: uppercase; letter-spacing: .12em; color: var(--text-faint); }

/* ===== Surface card (заменяет «белую плёнку» glass-card) ===== */
.card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: var(--space-5);
    transition: transform var(--dur) var(--ease-out),
                box-shadow var(--dur) var(--ease-out),
                border-color var(--dur) var(--ease-out);
}

.card:hover {
    transform: translateY(-6px);
    box-shadow: var(--shadow-card), var(--glow-gold);
    border-color: var(--border-strong);
}

/* ===== Services grid 4→2→1 ===== */
.services__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);
}

.service__num { font-family: var(--font-heading); font-size: var(--fs-h2); color: var(--gold); }
.service__name { font-size: var(--fs-h3); color: var(--gold-light); margin: var(--space-2) 0; }
.service__desc { color: var(--text-muted); }
.service__price { color: var(--text); margin-top: var(--space-3); } /* НЕ золотом: мелкий текст проваливает WCAG */
.service__more { display: inline-block; margin-top: var(--space-3); }

/* ===== Social proof: before/after slider + reviews ===== */
.proof__subtitle { font-size: var(--fs-h3); color: var(--gold-light); margin: var(--space-6) 0 var(--space-4); }

.ba-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
}

.ba {
    position: relative;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    user-select: none;
    touch-action: none; /* slider drag не скроллит страницу */
}

.ba__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.ba__after { clip-path: inset(0 0 0 50%); } /* JS обновляет правую границу через --pos */
.ba__handle {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    background: var(--gold);
    transform: translateX(-50%);
    cursor: ew-resize;
}
.ba__handle::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 36px;
    height: 36px;
    transform: translate(-50%, -50%);
    border: 2px solid var(--gold);
    border-radius: 50%;
    background: rgba(5, 5, 5, .4);
}
.ba__caption { position: absolute; left: var(--space-2); bottom: var(--space-2); font-size: var(--fs-caption); color: var(--text); background: rgba(5,5,5,.6); padding: 2px 8px; border-radius: var(--radius-sm); }

.reviews {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
    margin-top: var(--space-4);
}
.review__head { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3); }
.review__avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-strong); }
.review__name { font-size: var(--fs-h3); color: var(--gold-light); }
.review__service { font-size: var(--fs-caption); text-transform: uppercase; letter-spacing: .1em; color: var(--text-faint); }
.review__text { color: var(--text-muted); }

.proof__cta { display: flex; justify-content: center; margin-top: var(--space-7); }

/* ===== Booking form ===== */
.form {
    max-width: 520px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
}

.field { margin-bottom: var(--space-4); }
.field__label { display: block; font-size: var(--fs-caption); text-transform: uppercase; letter-spacing: .12em; color: var(--text-muted); margin-bottom: var(--space-2); }

.field__control {
    width: 100%;
    min-height: 48px;
    padding: var(--space-2) var(--space-3);
    background: var(--surface-hi);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text);
    font-family: var(--font-body);
    font-size: var(--fs-body);
    transition: border-color var(--dur) var(--ease-out);
}
.field__control:focus { border-color: var(--border-strong); outline: none; }
.field__control[aria-invalid="true"] { border-color: var(--danger); }

.field__error { display: block; min-height: 1.2em; margin-top: var(--space-1); font-size: var(--fs-caption); color: var(--danger); }

.form__status { margin-top: var(--space-3); min-height: 1.4em; font-size: var(--fs-body); }
.form__status.is-success { color: var(--gold-light); }
.form__status.is-error { color: var(--danger); }

.btn .spinner {
    width: 16px;
    height: 16px;
    margin-left: var(--space-2);
    border: 2px solid rgba(5, 5, 5, .4);
    border-top-color: var(--bg);
    border-radius: 50%;
    animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== Contacts + footer ===== */
.contacts__grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-5); }
.contacts__item { color: var(--text-muted); }
.contacts__item strong { color: var(--text); display: block; font-weight: 600; }

.socials { display: flex; gap: var(--space-3); margin-top: var(--space-3); }
.socials__link {
    width: 44px;
    height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-strong);
    border-radius: 50%;
    color: var(--gold);
    transition: background var(--dur) var(--ease-out), color var(--dur) var(--ease-out);
}
.socials__link:hover { background: var(--gold); color: var(--bg); }
.socials__link svg { width: 20px; height: 20px; fill: currentColor; }

.footer {
    border-top: 1px solid var(--border);
    padding: var(--space-6) var(--space-4);
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    justify-content: space-between;
    align-items: center;
    color: var(--text-faint);
    font-size: var(--fs-caption);
}

/* ===== Mobile nav overlay ===== */
.nav__links.is-open {
    display: flex;
    flex-direction: column;
    position: fixed;
    inset: 0;
    background: var(--bg);
    justify-content: center;
    align-items: center;
    gap: var(--space-5);
    mix-blend-mode: normal;
}

/* ===== Responsive ===== */
@media (max-width: 1024px) {
    .services__grid { grid-template-columns: repeat(2, 1fr); }
    .reviews { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
    .nav { mix-blend-mode: normal; }
    .nav__links { display: none; }
    .nav__burger { display: flex; }
    .services__grid,
    .reviews,
    .ba-grid,
    .contacts__grid { grid-template-columns: 1fr; }
    .section { padding: var(--space-7) var(--space-4); }
    .form { padding: var(--space-5); }
}

/* Кастомный курсор — только desktop (фикс тач-бага) */
@media (hover: none), (pointer: coarse) {
    .custom-cursor,
    .custom-cursor-follower { display: none !important; }
}
```

- [ ] **Step 2: Сборка цела**

Run: `npm run build`
Expected: `✓ built` без ошибок.

- [ ] **Step 3: Commit**

```bash
git add src/style.css
git commit -m "feat(style): nav/burger, sections, surface cards, before-after, form, contacts, responsive"
```

---

## Task 4: Favicon-монограмма + `<head>`

Заменяем стартовый `vite.svg` на золотую SVG-монограмму, обновляем `<head>`: `lang="ru"`, русский
title, ссылка на новый favicon, preconnect/preload шрифтов (Playfair критичный вес — preload).

**Files:**
- Create: `public/favicon.svg`
- Delete: `public/vite.svg`
- Modify: `index.html` (только `<head>` и `lang`)

- [ ] **Step 1: Создать `public/favicon.svg`:**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="12" fill="#050505"/>
  <text x="32" y="44" text-anchor="middle" font-family="Playfair Display, Georgia, serif"
        font-size="40" fill="#D4AF37">E</text>
</svg>
```

- [ ] **Step 2: Удалить стартовый favicon**

```bash
git rm public/vite.svg
```

- [ ] **Step 3: Заменить `<head>` в `index.html`**

Заменить текущие строки 2–11 (от `<html lang="en">` до `</head>`) на:

```html
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="ESTETICAURA Love — премиальная бьюти-студия. Косметология, массаж, эстетика, уход. Запись на приём." />
    <title>ESTETICAURA Love — премиальная бьюти-студия</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  </head>
```

- [ ] **Step 4: Сборка цела + favicon попал в dist**

Run: `npm run build && ls dist/favicon.svg`
Expected: `✓ built`, файл `dist/favicon.svg` существует.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: gold monogram favicon, ru lang, head meta + font preload"
```

---

## Task 5: `index.html` — 8 русских секций без inline-стилей

Полная замена `<body>`: навигация с бургером, hero, О студии (+ мета), Услуги (4 карты), Социальное
доказательство (2 слайдера до/после + 3 отзыва + дубль-CTA), Запись (форма), Контакты, Футер.
**Ни одного `style="..."`.** Все хуки — классы дизайн-системы и атрибуты для JS (`data-*`, `id`).
Контент — осмысленные RU-заглушки, помеченные `<!-- TODO: replace with real data -->`.

**Files:**
- Modify: `index.html` (заменить `<body>…</body>`, строки от `<body>` до `</body>` включительно)

- [ ] **Step 1: Заменить весь `<body>` в `index.html` на:**

```html
  <body>
    <canvas class="webgl"></canvas>

    <nav class="nav">
      <a href="#hero" class="nav__logo">ESTETICAURA</a>
      <button class="nav__burger" aria-label="Открыть меню" aria-expanded="false" data-burger>
        <span></span><span></span><span></span>
      </button>
      <div class="nav__links" data-nav-links>
        <a href="#about" class="nav__link">О студии</a>
        <a href="#services" class="nav__link">Услуги</a>
        <a href="#booking" class="nav__link">Запись</a>
        <a href="#contacts" class="nav__link">Контакты</a>
        <a href="#booking" class="btn">Записаться</a>
      </div>
    </nav>

    <main>
      <!-- 1. Hero -->
      <section id="hero" class="hero">
        <h1 class="hero__title">Esteticaura Love</h1>
        <p class="hero__subtitle">Где красота становится искусством</p>
        <div class="hero__actions">
          <a href="#booking" class="btn">Записаться</a>
          <a href="#services" class="btn--ghost btn">Услуги</a>
        </div>
      </section>

      <!-- 2. О студии -->
      <section id="about" class="section">
        <p class="section__caption">О студии</p>
        <h2 class="section__title">Наша философия</h2>
        <p class="about__lead">
          Мы убеждены, что красота — это форма искусства. В ESTETICAURA Love мы соединяем
          передовые эстетические технологии с холистическим подходом, чтобы раскрыть ваше
          внутреннее сияние.
        </p>
        <!-- TODO: replace with real data -->
        <div class="meta">
          <div class="meta__item"><span class="meta__num tabular">8 лет</span><span class="meta__label">на рынке</span></div>
          <div class="meta__item"><span class="meta__num tabular">5000+</span><span class="meta__label">клиентов</span></div>
          <div class="meta__item"><span class="meta__num tabular">12</span><span class="meta__label">мастеров</span></div>
        </div>
      </section>

      <!-- 3. Услуги -->
      <section id="services" class="section">
        <p class="section__caption">Услуги</p>
        <h2 class="section__title">Что мы предлагаем</h2>
        <!-- TODO: replace with real data (prices) -->
        <div class="services__grid">
          <article class="card">
            <span class="service__num tabular">01</span>
            <h3 class="service__name">Косметология</h3>
            <p class="service__desc">Аппаратный и инъекционный уход для безупречного состояния кожи.</p>
            <p class="service__price tabular">от 3 000 ₽</p>
            <a href="#booking" class="service__more nav__link">Подробнее</a>
          </article>
          <article class="card">
            <span class="service__num tabular">02</span>
            <h3 class="service__name">Массаж</h3>
            <p class="service__desc">Расслабляющие и моделирующие техники для тела и лица.</p>
            <p class="service__price tabular">от 2 500 ₽</p>
            <a href="#booking" class="service__more nav__link">Подробнее</a>
          </article>
          <article class="card">
            <span class="service__num tabular">03</span>
            <h3 class="service__name">Эстетика</h3>
            <p class="service__desc">Точные процедуры для естественной, ухоженной красоты.</p>
            <p class="service__price tabular">от 4 000 ₽</p>
            <a href="#booking" class="service__more nav__link">Подробнее</a>
          </article>
          <article class="card">
            <span class="service__num tabular">04</span>
            <h3 class="service__name">Уход</h3>
            <p class="service__desc">Программы домашнего и салонного ухода под ваш тип кожи.</p>
            <p class="service__price tabular">от 1 800 ₽</p>
            <a href="#booking" class="service__more nav__link">Подробнее</a>
          </article>
        </div>
      </section>

      <!-- 4. Социальное доказательство -->
      <section id="proof" class="section">
        <p class="section__caption">Нам доверяют</p>
        <h2 class="section__title">Результаты говорят сами</h2>

        <h3 class="proof__subtitle">Работы до / после</h3>
        <!-- TODO: replace with real images. Slider JS wires via [data-ba]. -->
        <div class="ba-grid">
          <div class="ba" data-ba>
            <img class="ba__img" src="https://placehold.co/800x600/0E0E0F/8A6E2F?text=До" alt="До процедуры" width="800" height="600">
            <img class="ba__img ba__after" data-ba-after src="https://placehold.co/800x600/16161A/D4AF37?text=После" alt="После процедуры" width="800" height="600">
            <div class="ba__handle" data-ba-handle></div>
            <span class="ba__caption">Косметология</span>
          </div>
          <div class="ba" data-ba>
            <img class="ba__img" src="https://placehold.co/800x600/0E0E0F/8A6E2F?text=До" alt="До процедуры" width="800" height="600">
            <img class="ba__img ba__after" data-ba-after src="https://placehold.co/800x600/16161A/D4AF37?text=После" alt="После процедуры" width="800" height="600">
            <div class="ba__handle" data-ba-handle></div>
            <span class="ba__caption">Эстетика</span>
          </div>
        </div>

        <h3 class="proof__subtitle">Отзывы</h3>
        <!-- TODO: replace with real reviews -->
        <div class="reviews">
          <article class="card">
            <div class="review__head">
              <img class="review__avatar" src="https://placehold.co/96x96/16161A/D4AF37?text=А" alt="" width="96" height="96">
              <div><div class="review__name">Анна</div><div class="review__service">Косметология</div></div>
            </div>
            <p class="review__text">«Кожа преобразилась за курс. Внимательные мастера и спокойная атмосфера.»</p>
          </article>
          <article class="card">
            <div class="review__head">
              <img class="review__avatar" src="https://placehold.co/96x96/16161A/D4AF37?text=М" alt="" width="96" height="96">
              <div><div class="review__name">Мария</div><div class="review__service">Массаж</div></div>
            </div>
            <p class="review__text">«Лучший массаж в городе. Ухожу как заново родившаяся.»</p>
          </article>
          <article class="card">
            <div class="review__head">
              <img class="review__avatar" src="https://placehold.co/96x96/16161A/D4AF37?text=Е" alt="" width="96" height="96">
              <div><div class="review__name">Елена</div><div class="review__service">Эстетика</div></div>
            </div>
            <p class="review__text">«Естественный результат, которого я искала. Рекомендую студию.»</p>
          </article>
        </div>

        <div class="proof__cta"><a href="#booking" class="btn">Записаться</a></div>
      </section>

      <!-- 5. Запись -->
      <section id="booking" class="section">
        <p class="section__caption">Запись</p>
        <h2 class="section__title">Записаться на приём</h2>
        <form class="form" data-booking novalidate>
          <div class="field">
            <label class="field__label" for="name">Имя</label>
            <input class="field__control" id="name" name="name" type="text" autocomplete="name" required>
            <span class="field__error" id="name-error" role="alert" aria-live="polite"></span>
          </div>
          <div class="field">
            <label class="field__label" for="phone">Телефон</label>
            <input class="field__control" id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required>
            <span class="field__error" id="phone-error" role="alert" aria-live="polite"></span>
          </div>
          <div class="field">
            <label class="field__label" for="service">Услуга</label>
            <select class="field__control" id="service" name="service" required>
              <option value="">Выберите услугу</option>
              <option>Косметология</option>
              <option>Массаж</option>
              <option>Эстетика</option>
              <option>Уход</option>
            </select>
            <span class="field__error" id="service-error" role="alert" aria-live="polite"></span>
          </div>
          <button class="btn" type="submit" data-submit>Отправить заявку</button>
          <p class="form__status" data-status role="status" aria-live="polite"></p>
        </form>
      </section>

      <!-- 6. Контакты -->
      <section id="contacts" class="section">
        <p class="section__caption">Контакты</p>
        <h2 class="section__title">Как нас найти</h2>
        <!-- TODO: replace with real data -->
        <div class="contacts__grid">
          <div class="contacts__item"><strong>Адрес</strong>Москва, ул. Красоты, 12</div>
          <div class="contacts__item"><strong>Телефон</strong><a href="tel:+79990000000" class="tabular">+7 999 000-00-00</a></div>
          <div class="contacts__item"><strong>Часы работы</strong>Ежедневно 10:00–21:00</div>
          <div class="contacts__item">
            <strong>Мы в сети</strong>
            <a href="mailto:hello@esteticaura.love">hello@esteticaura.love</a>
            <div class="socials">
              <a class="socials__link" href="https://t.me/esteticaura" aria-label="Telegram" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.8 16.6l-.4 4c.5 0 .8-.2 1-.5l2.5-2.3 5 3.7c.9.5 1.6.2 1.8-.8l3.3-15.3c.3-1.3-.5-1.8-1.4-1.5L1.5 9.6C.2 10.1.2 10.9 1.3 11.2l5.3 1.6L18.9 6c.5-.3 1-.2.6.2L9.8 16.6z"/></svg>
              </a>
              <a class="socials__link" href="https://wa.me/79990000000" aria-label="WhatsApp" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-2.7-1-4.4-3.7-4.6-3.9-.1-.2-1-1.4-1-2.6 0-1.2.6-1.8.9-2.1.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.7 1.7c.1.2 0 .4-.1.5l-.3.4c-.1.1-.2.3-.1.5.2.3.8 1.2 1.6 1.7 1 .6 1.4.6 1.6.5.2-.1.4-.5.6-.7.1-.2.3-.2.5-.1l1.6.8c.2.1.4.2.4.3.1.2.1.6 0 1z"/></svg>
              </a>
              <a class="socials__link" href="https://instagram.com/esteticaura" aria-label="Instagram" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.1.4.3 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.1-1 .3-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.1-.4-.3-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.1 1-.3 2.2-.4 1.3-.1 1.7-.1 4.9-.1zm0 3.2A6.6 6.6 0 1018.6 12 6.6 6.6 0 0012 5.4zm0 10.9A4.3 4.3 0 1116.3 12 4.3 4.3 0 0112 16.3zm6.8-11.1a1.5 1.5 0 11-1.5-1.5 1.5 1.5 0 011.5 1.5z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 7+8. Footer -->
    <footer class="footer">
      <span class="nav__logo">ESTETICAURA</span>
      <span class="tabular">© 2026 ESTETICAURA Love. Все права защищены.</span>
      <a href="#" class="nav__link">Политика конфиденциальности</a>
    </footer>

    <script type="module" src="/src/main.js"></script>
  </body>
```

- [ ] **Step 2: Нет ни одного inline-стиля**

Run: `grep -n 'style="' index.html`
Expected: пусто (grep exit 1 = успех). Если нашёл — убрать в классы.

- [ ] **Step 3: Сборка цела**

Run: `npm run build`
Expected: `✓ built` без ошибок.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: russian 8-section markup, no inline styles, a11y form + burger"
```

---

## Task 6: `Cursor.js` — media-гард (только desktop)

Фикс тач-бага: курсор инстанцируется только на устройствах с точным указателем и hover.
Гард — `matchMedia` в начале конструктора; плюс CSS уже прячет `.custom-cursor*` на тач (Task 3).

**Files:**
- Modify: `src/ui/Cursor.js`

- [ ] **Step 1: Вставить media-гард в начало конструктора `Cursor`**

Заменить начало конструктора (строки 4–7, от `constructor() {` до первого `appendChild`) так,
чтобы СРАЗУ после `constructor() {` стояла проверка и ранний выход:

```js
    constructor() {
        // Desktop-only: тач-устройства не имеют курсора (фикс «висящего» курсора в углу).
        this.enabled = window.matchMedia('(hover: hover) and (pointer: fine)').matches
        if (!this.enabled) return

        this.cursor = document.createElement('div')
        this.cursor.classList.add('custom-cursor')
        document.body.appendChild(this.cursor)
```

(Остальное тело конструктора и методы `addStyles()`/`initEvents()` — без изменений.)

- [ ] **Step 2: Проверить синтаксис**

Run: `node --check src/ui/Cursor.js && echo OK`
Expected: `OK`

- [ ] **Step 3: Сборка цела**

Run: `npm run build`
Expected: `✓ built` без ошибок.

- [ ] **Step 4: Commit**

```bash
git add src/ui/Cursor.js
git commit -m "fix(cursor): desktop-only guard (hover+fine pointer), fixes touch bug"
```

---

## Task 7: `Preloader.js` — стили в дизайн-систему

Спека §6: «Прелоадер: стили в систему». Сейчас `Preloader.addStyles()` инжектит `<style>` рантаймом
с хардкод-цветами. Переносим стили в `style.css` (через токены) и удаляем `addStyles()`.

**Files:**
- Modify: `src/style.css` (append), `src/ui/Preloader.js`

- [ ] **Step 1: Дописать в конец `src/style.css`:**

```css
/* ===== Preloader ===== */
.preloader {
    position: fixed;
    inset: 0;
    z-index: var(--z-preloader);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    background: var(--bg);
    color: var(--gold);
}
.preloader-logo {
    font-family: var(--font-heading);
    font-size: 2rem;
    letter-spacing: .1em;
    margin-bottom: var(--space-3);
    opacity: 0;
    animation: preloader-fade 1s forwards;
}
.preloader-bar-container {
    width: 200px;
    height: 2px;
    background: var(--border);
    position: relative;
    overflow: hidden;
}
.preloader-bar {
    position: absolute;
    inset: 0;
    width: 100%;
    background: var(--gold);
    animation: preloader-load 2s infinite;
}
@keyframes preloader-fade { to { opacity: 1; } }
@keyframes preloader-load {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}
```

- [ ] **Step 2: Удалить `addStyles()` из `Preloader.js` и его вызов**

В `src/ui/Preloader.js`: удалить строку `this.addStyles()` из конструктора и весь метод
`addStyles() { … }`. Метод `hide()` и `import gsap` остаются. Конструктор после правки
заканчивается блоком готовности (`if (this.experience.ready) …` + `setTimeout(… 4000)`),
сразу за ним идёт метод `hide()`.

- [ ] **Step 3: Проверить, что `addStyles` удалён и синтаксис цел**

Run: `grep -n "addStyles" src/ui/Preloader.js; node --check src/ui/Preloader.js && echo OK`
Expected: grep ничего не печатает (нет `addStyles`), затем `OK`.

- [ ] **Step 4: Сборка цела**

Run: `npm run build`
Expected: `✓ built` без ошибок.

- [ ] **Step 5: Commit**

```bash
git add src/style.css src/ui/Preloader.js
git commit -m "refactor(preloader): move styles into design system, drop runtime addStyles"
```

---

## Task 8: `validation.js` — чистая логика формы (TDD)

Чистые функции: нормализация/валидация имени и телефона (RU), сборка текста заявки и
Telegram-ссылки. **Пишем по TDD** (тест → провал → реализация → проход).

**Files:**
- Create: `src/ui/validation.js`, `src/ui/validation.test.js`

- [ ] **Step 1: Написать падающие тесты `src/ui/validation.test.js`:**

```js
import { describe, it, expect } from 'vitest'
import {
    validateName,
    normalizePhone,
    validatePhone,
    buildBookingText,
    buildTelegramShareUrl,
} from './validation.js'

describe('validateName', () => {
    it('rejects too short / empty', () => {
        expect(validateName('')).toBe(false)
        expect(validateName(' a ')).toBe(false)
    })
    it('accepts cyrillic names with spaces and hyphen', () => {
        expect(validateName('Анна')).toBe(true)
        expect(validateName('Анна-Мария')).toBe(true)
        expect(validateName('Mary Jane')).toBe(true)
    })
    it('rejects names with digits', () => {
        expect(validateName('Анна2')).toBe(false)
    })
})

describe('normalizePhone', () => {
    it('strips non-digits', () => {
        expect(normalizePhone('+7 (999) 000-00-00')).toBe('79990000000')
    })
})

describe('validatePhone', () => {
    it('accepts 11-digit RU starting 7 or 8', () => {
        expect(validatePhone('+7 999 000 00 00')).toBe(true)
        expect(validatePhone('8 999 000 00 00')).toBe(true)
    })
    it('accepts bare 10-digit', () => {
        expect(validatePhone('9990000000')).toBe(true)
    })
    it('rejects too short', () => {
        expect(validatePhone('12345')).toBe(false)
    })
})

describe('buildBookingText', () => {
    it('composes a multiline ru message', () => {
        const txt = buildBookingText({ name: 'Анна', phone: '+7 999 000-00-00', service: 'Массаж' })
        expect(txt).toContain('Анна')
        expect(txt).toContain('+7 999 000-00-00')
        expect(txt).toContain('Массаж')
        expect(txt.split('\n').length).toBeGreaterThanOrEqual(4)
    })
})

describe('buildTelegramShareUrl', () => {
    it('url-encodes the text into a t.me/share link', () => {
        const url = buildTelegramShareUrl('Привет мир')
        expect(url.startsWith('https://t.me/share/url?')).toBe(true)
        expect(url).toContain(encodeURIComponent('Привет мир'))
    })
})
```

- [ ] **Step 2: Запустить — тесты падают (модуль не существует)**

Run: `npm test`
Expected: FAIL (`Failed to resolve import './validation.js'` / functions undefined).

- [ ] **Step 3: Реализовать `src/ui/validation.js`:**

```js
// Pure, framework-free form logic. Unit-tested in validation.test.js.

// Telegram target — swap for the real studio handle/site before launch.
export const STUDIO_SITE_URL = 'https://esteticaura.love'

export function validateName(raw) {
    const value = String(raw ?? '').trim()
    // Letters (any language), spaces, apostrophe, hyphen; min 2 chars.
    return /^[\p{L}][\p{L}\s'-]{1,}$/u.test(value)
}

export function normalizePhone(raw) {
    return String(raw ?? '').replace(/\D/g, '')
}

export function validatePhone(raw) {
    const digits = normalizePhone(raw)
    if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) return true
    if (digits.length === 10) return true
    return false
}

export function buildBookingText({ name, phone, service }) {
    return [
        'Здравствуйте! Хочу записаться на приём.',
        `Имя: ${name}`,
        `Телефон: ${phone}`,
        `Услуга: ${service}`,
    ].join('\n')
}

export function buildTelegramShareUrl(text) {
    // Use encodeURIComponent (not URLSearchParams): spaces must be %20, matching the test.
    return `https://t.me/share/url?url=${encodeURIComponent(STUDIO_SITE_URL)}&text=${encodeURIComponent(text)}`
}
```

- [ ] **Step 4: Запустить — тесты проходят**

Run: `npm test`
Expected: все тесты PASS, exit 0.

- [ ] **Step 5: Сборка цела**

Run: `npm run build`
Expected: `✓ built` (тест-файл vite в бандл не тянет).

- [ ] **Step 6: Commit**

```bash
git add src/ui/validation.js src/ui/validation.test.js
git commit -m "feat(form): pure validators + telegram share url builder (TDD)"
```

---

## Task 9: `BookingForm.js` — обвязка формы

DOM-обвязка: валидация на blur (не на каждый кейстрок), ошибки под полем с `aria-live`, состояния
кнопки (спиннер) → успех/ошибка (не `alert`), отправка — открытие Telegram-ссылки в новой вкладке.
Чистую логику берёт из `validation.js`. Верификация — ручная (DOM); юнит-тесты не дублируем.

**Files:**
- Create: `src/ui/BookingForm.js`

- [ ] **Step 1: Создать `src/ui/BookingForm.js`:**

```js
import {
    validateName,
    validatePhone,
    buildBookingText,
    buildTelegramShareUrl,
} from './validation.js'

// Wires the booking <form data-booking> to pure validators + telegram submit.
// Validation runs on blur; errors announced via aria-live spans.
export default class BookingForm {
    constructor() {
        this.form = document.querySelector('[data-booking]')
        if (!this.form) return

        this.fields = {
            name: { input: this.form.querySelector('#name'), error: this.form.querySelector('#name-error'), validate: validateName, message: 'Введите имя (минимум 2 буквы).' },
            phone: { input: this.form.querySelector('#phone'), error: this.form.querySelector('#phone-error'), validate: validatePhone, message: 'Введите корректный номер телефона.' },
            service: { input: this.form.querySelector('#service'), error: this.form.querySelector('#service-error'), validate: (v) => v.trim() !== '', message: 'Выберите услугу.' },
        }
        this.submitBtn = this.form.querySelector('[data-submit]')
        this.status = this.form.querySelector('[data-status]')

        this.bindBlur()
        this.form.addEventListener('submit', (e) => this.onSubmit(e))
    }

    bindBlur() {
        for (const field of Object.values(this.fields)) {
            field.input.addEventListener('blur', () => this.checkField(field))
        }
    }

    checkField(field) {
        const ok = field.validate(field.input.value)
        field.input.setAttribute('aria-invalid', ok ? 'false' : 'true')
        field.error.textContent = ok ? '' : field.message
        return ok
    }

    onSubmit(e) {
        e.preventDefault()
        this.setStatus('', '')

        const results = Object.values(this.fields).map((f) => this.checkField(f))
        if (results.includes(false)) {
            this.setStatus('Проверьте поля формы.', 'is-error')
            return
        }

        this.setSubmitting(true)
        try {
            const data = {
                name: this.fields.name.input.value.trim(),
                phone: this.fields.phone.input.value.trim(),
                service: this.fields.service.input.value,
            }
            const url = buildTelegramShareUrl(buildBookingText(data))
            window.open(url, '_blank', 'noopener')
            this.setStatus('Заявка готова — отправьте её в открывшемся Telegram.', 'is-success')
            this.form.reset()
        } catch (err) {
            this.setStatus('Не удалось открыть Telegram. Напишите нам напрямую.', 'is-error')
        } finally {
            this.setSubmitting(false)
        }
    }

    setSubmitting(on) {
        this.submitBtn.disabled = on
        this.submitBtn.innerHTML = on
            ? 'Отправка<span class="spinner"></span>'
            : 'Отправить заявку'
    }

    setStatus(text, cls) {
        this.status.textContent = text
        this.status.className = `form__status ${cls}`.trim()
    }
}
```

- [ ] **Step 2: Проверить синтаксис**

Run: `node --check src/ui/BookingForm.js && echo OK`
Expected: `OK`

- [ ] **Step 3: Сборка цела** (модуль ещё не импортирован — vite его не парсит; проверка синтаксиса в Step 2)

Run: `npm run build`
Expected: `✓ built`.

- [ ] **Step 4: Commit**

```bash
git add src/ui/BookingForm.js
git commit -m "feat(form): BookingForm — blur validation, states, telegram submit"
```

---

## Task 10: `Nav.js` — бургер, smooth-scroll, active-link

Бургер-overlay на mobile (toggle классов + `aria-expanded` + scroll-lock), плавный скролл по
якорям, подсветка активной секции через `IntersectionObserver`. Верификация — ручная.

**Files:**
- Create: `src/ui/Nav.js`

- [ ] **Step 1: Создать `src/ui/Nav.js`:**

```js
// Burger menu + smooth in-page nav + active-section highlight.
export default class Nav {
    constructor() {
        this.burger = document.querySelector('[data-burger]')
        this.links = document.querySelector('[data-nav-links]')
        this.navLinks = Array.from(document.querySelectorAll('.nav__link[href^="#"]'))
        if (!this.burger || !this.links) return

        this.burger.addEventListener('click', () => this.toggle())
        this.links.addEventListener('click', (e) => {
            if (e.target.closest('a')) this.close()
        })

        this.setupActiveHighlight()
    }

    toggle() {
        this.links.classList.contains('is-open') ? this.close() : this.open()
    }

    open() {
        this.links.classList.add('is-open')
        this.burger.classList.add('is-open')
        this.burger.setAttribute('aria-expanded', 'true')
        this.burger.setAttribute('aria-label', 'Закрыть меню')
        document.body.style.overflow = 'hidden'
    }

    close() {
        this.links.classList.remove('is-open')
        this.burger.classList.remove('is-open')
        this.burger.setAttribute('aria-expanded', 'false')
        this.burger.setAttribute('aria-label', 'Открыть меню')
        document.body.style.overflow = ''
    }

    setupActiveHighlight() {
        const sections = this.navLinks
            .map((link) => document.querySelector(link.getAttribute('href')))
            .filter(Boolean)
        if (!sections.length || !('IntersectionObserver' in window)) return

        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue
                const id = `#${entry.target.id}`
                this.navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === id))
            }
        }, { rootMargin: '-50% 0px -50% 0px' })

        sections.forEach((s) => observer.observe(s))
    }
}
```

- [ ] **Step 2: Проверить синтаксис**

Run: `node --check src/ui/Nav.js && echo OK`
Expected: `OK`

- [ ] **Step 3: Сборка цела**

Run: `npm run build`
Expected: `✓ built`.

- [ ] **Step 4: Commit**

```bash
git add src/ui/Nav.js
git commit -m "feat(nav): burger overlay, smooth scroll, active-section highlight"
```

---

## Task 11: `BeforeAfter.js` + `slider.js` — слайдер до/после (TDD-хелпер)

Чистый хелпер позиции (`clampPercent`, `positionFromPointer`) — по TDD. DOM-драг (pointer events)
обновляет `clip-path` «после»-картинки и позицию ручки. Верификация компонента — ручная.

**Files:**
- Create: `src/ui/slider.js`, `src/ui/slider.test.js`, `src/ui/BeforeAfter.js`

- [ ] **Step 1: Написать падающие тесты `src/ui/slider.test.js`:**

```js
import { describe, it, expect } from 'vitest'
import { clampPercent, positionFromPointer } from './slider.js'

describe('clampPercent', () => {
    it('clamps below 0 and above 100', () => {
        expect(clampPercent(-20)).toBe(0)
        expect(clampPercent(140)).toBe(100)
    })
    it('passes through in-range', () => {
        expect(clampPercent(42.5)).toBe(42.5)
    })
})

describe('positionFromPointer', () => {
    it('maps clientX within a rect to a 0..100 percent', () => {
        const rect = { left: 100, width: 200 }
        expect(positionFromPointer(100, rect)).toBe(0)
        expect(positionFromPointer(300, rect)).toBe(100)
        expect(positionFromPointer(200, rect)).toBe(50)
    })
    it('clamps when pointer is outside the rect', () => {
        const rect = { left: 0, width: 100 }
        expect(positionFromPointer(-50, rect)).toBe(0)
        expect(positionFromPointer(150, rect)).toBe(100)
    })
})
```

- [ ] **Step 2: Запустить — падает**

Run: `npm test`
Expected: FAIL (`Failed to resolve import './slider.js'`).

- [ ] **Step 3: Реализовать `src/ui/slider.js`:**

```js
// Pure geometry helpers for the before/after slider. Unit-tested in slider.test.js.

export function clampPercent(value) {
    return Math.min(100, Math.max(0, value))
}

export function positionFromPointer(clientX, rect) {
    const raw = ((clientX - rect.left) / rect.width) * 100
    return clampPercent(raw)
}
```

- [ ] **Step 4: Запустить — проходит**

Run: `npm test`
Expected: все тесты PASS (включая validation.* из Task 8).

- [ ] **Step 5: Реализовать `src/ui/BeforeAfter.js`:**

```js
import { positionFromPointer } from './slider.js'

// Interactive before/after comparison. Each [data-ba] holds a base img, a
// [data-ba-after] overlay (clip-path), and a [data-ba-handle] divider.
export default class BeforeAfter {
    constructor() {
        this.instances = Array.from(document.querySelectorAll('[data-ba]'))
        this.instances.forEach((el) => this.bind(el))
    }

    bind(root) {
        const after = root.querySelector('[data-ba-after]')
        const handle = root.querySelector('[data-ba-handle]')
        if (!after || !handle) return

        const setPos = (clientX) => {
            const pct = positionFromPointer(clientX, root.getBoundingClientRect())
            after.style.clipPath = `inset(0 0 0 ${pct}%)`
            handle.style.left = `${pct}%`
        }

        let dragging = false
        const start = (e) => { dragging = true; setPos(e.clientX); root.setPointerCapture?.(e.pointerId) }
        const move = (e) => { if (dragging) setPos(e.clientX) }
        const end = () => { dragging = false }

        root.addEventListener('pointerdown', start)
        root.addEventListener('pointermove', move)
        window.addEventListener('pointerup', end)
    }
}
```

- [ ] **Step 6: Проверить синтаксис + сборка**

Run: `node --check src/ui/BeforeAfter.js && npm run build`
Expected: нет ошибок; `✓ built`.

- [ ] **Step 7: Commit**

```bash
git add src/ui/slider.js src/ui/slider.test.js src/ui/BeforeAfter.js
git commit -m "feat(proof): before/after slider with TDD geometry helpers"
```

---

## Task 12: `main.js` — подключить Nav + BookingForm + BeforeAfter

Точка интеграции: инстанцируем новые UI-классы. После этой задачи модули входят в граф импорта.

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Полностью заменить `src/main.js` на:**

```js
import './style.css'
import Experience from './webgl/Experience.js'
import Cursor from './ui/Cursor.js'
import Preloader from './ui/Preloader.js'
import Nav from './ui/Nav.js'
import BookingForm from './ui/BookingForm.js'
import BeforeAfter from './ui/BeforeAfter.js'

const experience = new Experience(document.querySelector('canvas.webgl'))
const cursor = new Cursor()
const preloader = new Preloader(experience)
const nav = new Nav()
const bookingForm = new BookingForm()
const beforeAfter = new BeforeAfter()
```

- [ ] **Step 2: Сборка цела (теперь весь граф включает новые модули)**

Run: `npm run build`
Expected: `✓ built` без ошибок.

- [ ] **Step 3: Все тесты зелёные**

Run: `npm test`
Expected: validation.* + slider.* — все PASS.

- [ ] **Step 4: Dev-сервер поднимается без ошибок**

Run: `npm run dev` (открыть localhost). Глазами проверить:
- nav фиксирован; на узком вьюпорте — бургер открывает/закрывает overlay;
- все 8 секций на русском, без «съехавших» inline-стилей;
- карточки услуг на `--surface` (не «белая плёнка»), цены `tabular-nums`;
- слайдер до/после двигается мышью/тачем;
- форма: blur по пустому полю → ошибка под полем; submit с валидными данными → открывается
  Telegram, статус-сообщение (не `alert`);
- на тач-эмуляции кастомный курсор отсутствует;
- в консоли браузера нет ошибок.

- [ ] **Step 5: Commit**

```bash
git add src/main.js
git commit -m "feat: wire Nav, BookingForm, BeforeAfter into app entry"
```

---

## Task 13: Финальная верификация + gate `ui-ux-pro-max`

**Files:** проверки + правки по результатам gate.

- [ ] **Step 1: Полный прогон проверок**

```bash
npm run build   # ✓ built
npm test        # все PASS
grep -n 'style="' index.html   # пусто (нет inline-стилей)
```

- [ ] **Step 2: Gate `ui-ux-pro-max`** — обязательный по `CLAUDE.md`

Прогнать ревью дизайн-системы и разметки агентом `ui-ux-pro-max` на три вещи:
- **Контраст WCAG:** золото текстом только крупное (≥3:1); body/подписи `--text`/`--text-muted`
  (body ≥ 4.5:1); проверить пары `--text-faint`/`--surface`, `--gold`/`--bg` на кнопке.
- **A11y:** фокус-стейты видимы; `label`+`for` у полей; `aria-live` у ошибок; `aria-label` у
  иконок/бургера; порядок табуляции; `alt` у изображений.
- **Touch:** все интерактивные ≥ 44×44px (кнопки, nav-ссылки, соцыконки, бургер, поля/`select`).

Исправить найденное; пере-прогнать `npm run build` + `npm test` после правок.

- [ ] **Step 3: Маркер-коммит фазы**

```bash
git commit --allow-empty -m "chore: phase B complete — design system, ru content, booking form"
```

---

## Definition of Done (Фаза B)

- [ ] `npm run build` зелёный; `npm test` — все юниты (validation.*, slider.*) проходят.
- [ ] `index.html` — русский контент, все 8 секций (вкл. социальное доказательство и форму),
      **ни одного inline-стиля** (`grep 'style="'` пусто).
- [ ] Дизайн-система в `style.css`: токены спеки §3, две иерархии кнопок, карточки на `--surface`,
      `tabular-nums` на ценах/цифрах, адаптив 4→2→1, фокус-стейты, CSS-reduced-motion.
- [ ] Форма: валидация на blur, ошибки с `aria-live`, состояния (спиннер→успех/ошибка, не `alert`),
      отправка в Telegram с предзаполненным текстом.
- [ ] Бургер-меню работает; активная секция подсвечивается; кастомный курсор — только desktop.
- [ ] Слайдер до/после двигается мышью и тачем.
- [ ] Favicon — золотая монограмма; `lang="ru"`; `vite.svg` удалён.
- [ ] Пройден gate `ui-ux-pro-max` (контраст / a11y / touch), замечания исправлены.

**Следующая фаза:** C — 3D-апгрейд (материалы studio-grade, bloom, морфинг-crossfade, золотая пыль).
Учесть carry-forward из `docs/superpowers/notes/phase-a-review-carryforward.md` (дыхание капли vs
морф-tween). План пишется после завершения и проверки Фазы B.
```
