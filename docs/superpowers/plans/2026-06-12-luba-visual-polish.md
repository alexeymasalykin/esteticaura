# Visual polish — UI-motion, 3D-штрихи, шрифты, DPR, атмосфера

Дата: 2026-06-12. Основание: предложения после graphics upgrade, заказчик утвердил все
пункты в порядке A → B → C → D. Чувствительность заказчика: без мерцающего перегруза
(отвергнуты «осколки стекла» и звёздочки-блики).

## Блоки

### A. UI-motion (наибольший эффект)
- [x] Reveal секций по скроллу: `.reveal` (opacity 0 + translateY(26px) → видимое,
      650ms ease-out), IntersectionObserver, один раз, stagger детей через
      `--reveal-delay` (шаг 90ms, кап 360ms). Карточки услуг/отзывы/мета/контакты/
      поля формы — со стаггером; заголовки/лиды — одиночно. Hero не трогаем (своё интро).
      **reduced-motion: класс не вешается (JS-гейт) + CSS-страховка opacity:1.**
      Без JS контент виден (классы вешает только JS).
- [x] Hero-интро после прелоадера: split заголовка на слова (маска overflow,
      translateY(115%) → 0, stagger 120ms), затем подпись и кнопки fade-up.
      Триггер: 'experience-ready' + safety-таймаут 4.2s (паритет с Preloader).
      gsap уже в main-бандле (Preloader). Градиент background-clip:text переживает
      обёртки-спаны (fill transparent наследуется).
- [x] Shine sweep на `.btn` (primary): ::after-блик, transform-only, на hover один
      проход. Ghost/disabled — без блика. Карточки уже имеют лифт — не трогаем.
- TDD: чистые хелперы (staggerDelay, splitToWordSpans, shouldAnimate) — vitest;
  DOM/визуал — Playwright (обычный + emulateMedia reducedMotion).

### B. 3D-штрихи
- [x] Тилт бриллианта к курсору: rotation.x/z лерп к cursor*±0.06 rad, вес = uProgress
      (в пыли не мешает комете), поверх покадрового rotation.y.
- [x] «Дыхание»: uBreath = 1 + 0.015·sin(t·1.6) — масштаб только diamond-таргета
      в шейдере (aTarget·uFit·uBreath), без конфликта с GSAP-scale (burst/акт 3).
      Прецессия: лёгкий наклон оси sin/cos(t·0.2)·0.02·progress.

### C. Техкачество
- [x] Self-host шрифтов: woff2-сабсеты (latin+cyrillic) только используемых весов
      (Cormorant 400/600/700+i400, Inter 300/400/600 — сверить с CSS), @font-face с
      unicode-range, font-display:swap, preload двух критичных файлов, убрать
      Google Fonts из index.html.
- [x] Адаптивный DPR: замер среднего кадра (окно ~60 кадров) после старта; если
      >22ms — ступенчатое снижение pixelRatio (2→1.5→1.25→1) renderer+composer.
      Чистая функция решения (TDD) + глюе в Experience.

### D. Атмосфера (скриншоты до коммита)
- [x] Зерно + виньетка: fixed-оверлей (SVG-шум из постера, opacity ~.06, overlay) +
      радиальная виньетка; static, без анимации; pointer-events none; z между
      сценой и контентом.
- [x] Скролл-прогресс: 2px золотая полоска под шапкой, rAF-троттлинг, transform-only.
- [x] Пыльца акта 3: uShed (GSAP в окне акта 3), ~7% частиц (aPhase>0.93) — сток вниз
      sawtooth + fade. Амплитуда малая; если на скриншотах шумно — НЕ коммитить.

## Гейты
- Все анимации: transform/opacity only, 150–700ms, reduced-motion отключает хореографию
  (hover остаётся — правило проекта).
- ui-ux-pro-max чек в конце: контраст не трогаем, фокус-стили не перекрываются
  overflow-обёртками, touch ≥44px без изменений.
- Каждый блок: vitest + build зелёные, Playwright-скриншоты, атомарный коммит.
