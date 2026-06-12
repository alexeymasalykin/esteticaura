// Scroll-reveal choreography: sections fade-rise into place once, card grids with a
// short stagger. JS adds the .reveal class (no-JS keeps content visible); under
// prefers-reduced-motion no classes are added at all — content renders static.

const STAGGER_STEP_MS = 90
const STAGGER_CAP_MS = 360

export function staggerDelay(index) {
    return Math.min(index * STAGGER_STEP_MS, STAGGER_CAP_MS)
}

export function shouldAnimate({ reducedMotion, io }) {
    return !reducedMotion && io
}

// What reveals: single elements rise alone, `children` groups rise with a stagger.
const SINGLES = [
    '.section__caption', '.section__title', '.about__lead',
    '.proof__subtitle', '.proof__cta'
]
const GROUPS = [
    { parent: '.meta', children: '.meta__item' },
    { parent: '.services__grid', children: '.card' },
    { parent: '.ba-grid', children: '.ba' },
    { parent: '.reviews', children: '.card' },
    { parent: '.form', children: '.field, [data-submit]' },
    { parent: '.contacts__grid', children: '.contacts__item' }
]

export default class Reveal {
    constructor() {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (!shouldAnimate({ reducedMotion, io: 'IntersectionObserver' in window })) return

        this.observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue
                entry.target.classList.add('is-in')
                this.observer.unobserve(entry.target)
            }
        }, { rootMargin: '0px 0px -8% 0px' })

        for (const selector of SINGLES) {
            document.querySelectorAll(selector).forEach((el) => this.track(el, 0))
        }
        for (const { parent, children } of GROUPS) {
            document.querySelectorAll(parent).forEach((group) => {
                group.querySelectorAll(children).forEach((el, i) => this.track(el, staggerDelay(i)))
            })
        }
    }

    track(el, delayMs) {
        el.classList.add('reveal')
        if (delayMs) el.style.setProperty('--reveal-delay', `${delayMs}ms`)
        this.observer.observe(el)
    }
}
