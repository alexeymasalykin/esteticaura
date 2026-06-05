# Референс-борд: ESTETICAURA Love (золото-нуар, Three.js)

**Дата:** 2026-06-05
**Назначение:** насмотренность перед реализацией редизайна. Две части — UI-инспирация
(золото-нуар beauty) и техническая 3D-база (готовые параметры материалов/постпроцессинга).
**Связан со спекой:** `2026-06-05-luba-lending-redesign-design.md`.

---

## Часть 1. UI-инспирация (золото-нуар beauty)

Смотреть на композицию, ритм, типографику, работу с пустотой — НЕ копировать.

| Источник | Что смотреть |
|---|---|
| [Lapa Ninja — Beauty](https://www.lapa.ninja/category/beauty/) | 136 beauty-лендингов: hero-композиции, секции услуг |
| [Lapa Ninja — Black](https://www.lapa.ninja/color/black/) | Тёмные лендинги: контраст, акценты на чёрном |
| [99designs — Beauty](https://99designs.com/inspiration/websites/beauty) | Премиум-эстетика, типографика люкс |
| [Colorlib — Beauty salon sites](https://colorlib.com/wp/beauty-salon-websites/) | Структура салонов: услуги, запись, контакты |

**Подтверждённые тренды (из веб-ресёрча) под наш выбор золото-нуар:**
- Тёмный фон = премиум-атмосфера, продукт «в свете прожектора», сильный контраст CTA.
- Золото на чёрном = люкс/эксклюзивность; чёрный даёт максимальный контраст для золотой кнопки.
- Дисциплина: тёмная тема легко проваливает контраст подписей → строго следовать правилу контраста
  из спеки (золото-текст только крупное, `--text-faint ≥ 3:1`).

---

## Часть 2. 3D-база — готовые параметры (Three.js r160)

Источники: [Codrops — Transparent Glass & Plastic](https://tympanus.net/codrops/2021/10/27/creating-the-effect-of-transparent-glass-and-plastic-in-three-js/),
[MeshPhysicalMaterial docs](https://threejs.org/docs/pages/MeshPhysicalMaterial.html),
[RoomEnvironment docs](https://threejs.org/docs/pages/RoomEnvironment.html),
[UnrealBloomPass docs](https://threejs.org/docs/pages/UnrealBloomPass.html),
[Wael Yasmina — Unreal Bloom](https://waelyasmina.net/articles/unreal-bloom-selective-threejs-post-processing/),
[Glass Configurator (CodePen)](https://codepen.io/ksenia-k/pen/YzYRPwb).

### 2.1 Капля — дорогое стекло/вода
```js
new THREE.MeshPhysicalMaterial({
  transmission: 1,          // оптическая прозрачность (блики остаются)
  thickness: 0.5,           // ОБЯЗАТЕЛЬНО для рефракции (масштаб объекта ~1)
  roughness: 0.05,          // 0–0.15 = полированное стекло; 0.2–0.6 ПИКСЕЛИТ — избегать
  ior: 1.33,                // вода ~1.33, стекло ~1.45
  clearcoat: 1,
  clearcoatRoughness: 0,
  iridescence: 0.2,         // лёгкий перламутр (опц., в спеке)
  color: '#ffffff',
})
```
**Критично:** transmission-материал **требует environment map** — иначе артефакты и плоский вид.
Даём бесплатно через RoomEnvironment (2.3). Источник Codrops прямо: *"always specify an
environment map when using this material"*.

### 2.2 Кристалл — золотой драгоценный камень
```js
new THREE.MeshPhysicalMaterial({
  color: '#F7E7CE',         // шампань-база (env map даёт золотые отражения)
  metalness: 1,
  roughness: 0.15,
  flatShading: true,        // гранёный икосаэдр
  envMapIntensity: 1.2,     // подчеркнуть отражения окружения
})
```

### 2.3 Environment map — RoomEnvironment (без HDRI-файла)
```js
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const pmrem = new THREE.PMREMGenerator(renderer);
const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = envMap;          // IBL для всех PBR-материалов
// pmrem.dispose() после генерации
```
Это даёт реальные отражения на капле и кристалле **без скачивания ассетов** — ключ к «дорогому» виду.

### 2.4 Bloom — золотое свечение
```js
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }     from 'three/addons/postprocessing/OutputPass.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  0.4,   // strength — старт; золото на чёрном не перегружать
  1.2,   // radius
  0.1    // threshold — что считать «ярким»
);
composer.addPass(bloom);
composer.addPass(new OutputPass());   // ОБЯЗАТЕЛЕН последним: переносит тон-маппинг сюда
```
**Порядок проходов:** `RenderPass → UnrealBloomPass → OutputPass`. Значения strength/radius/threshold
тюнятся под сцену (старт выше — консервативный).

### Технические заметки (предотвращают типовые баги)
1. **OutputPass обязателен последним.** С EffectComposer тон-маппинг переносится в OutputPass; без
   него bloom «ломает» цвет/гамму (частая жалоба на форуме three.js). `renderer.toneMapping`
   (ACESFilmic) + exposure ~1.1–1.5 усиливают bloom — но финальный тон даёт OutputPass.
2. **Селективный bloom НЕ нужен.** Наш UI — HTML поверх `<canvas>`, он вне WebGL-сцены, поэтому bloom
   влияет только на 3D. Обычный (одно-композерный) bloom безопасен → проще и дешевле.
3. **transmission + постпроцессинг:** transmission рендерит через внутренний render target; проверить,
   что капля корректно выглядит сквозь EffectComposer (тестировать на этапе сборки сцены).
4. **roughness «мёртвая зона» 0.2–0.6** для transmission пикселит — держать каплю в 0–0.15.
5. **Производительность:** bloom + transmission — дорогие. Деградация из спеки (mobile/слабый GPU →
   без bloom или без 3D) обязательна.

---

## Как использовать борд

- **Верстка:** свериться с композицией люкс-лендингов (Часть 1), но держать нашу дизайн-систему.
- **3D:** взять параметры 2.1–2.4 как стартовые в `Droplet.js` / `Crystal.js` / `Environment.js` /
  `PostProcessing.js`, дотюнить визуально через lil-gui.
- На этапе кода — финальный прогон `ui-ux-pro-max` (контраст, a11y, touch) как gate.
