import gsap from 'gsap'

// Hero entrance after the preloader: title words slide up from under a mask, then
// the subtitle and CTAs fade-rise. Skipped entirely under prefers-reduced-motion.

const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function splitToWordSpans(text) {
    return text
        .trim()
        .split(/\s+/)
        .map((word) => `<span class="hero__word"><span class="hero__word-inner">${escapeHtml(word)}</span></span>`)
        .join(' ')
}

export default class HeroIntro {
    constructor() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        this.title = document.querySelector('.hero__title')
        this.subtitle = document.querySelector('.hero__subtitle')
        this.actions = document.querySelector('.hero__actions')
        if (!this.title) return

        this.title.innerHTML = splitToWordSpans(this.title.textContent)
        gsap.set('.hero__word-inner', { yPercent: 115 })
        gsap.set([this.subtitle, this.actions], { opacity: 0, y: 22 })

        // Same trigger discipline as the preloader: ready signal or a safety timeout.
        this.played = false
        window.addEventListener('experience-ready', () => this.play(), { once: true })
        setTimeout(() => this.play(), 4200)
    }

    play() {
        if (this.played) return
        this.played = true
        // The preloader starts fading at +0.5s (1s long) — slide the words in under it.
        const tl = gsap.timeline({ delay: 0.7 })
        tl.to('.hero__word-inner', {
            yPercent: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.12
        })
        tl.to([this.subtitle, this.actions], {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
            stagger: 0.15
        }, '-=0.35')
    }
}
