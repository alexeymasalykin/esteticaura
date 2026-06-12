import { describe, it, expect } from 'vitest'
import { staggerDelay, shouldAnimate } from './Reveal.js'
import { splitToWordSpans } from './HeroIntro.js'

describe('staggerDelay', () => {
    it('steps 90ms per item', () => {
        expect(staggerDelay(0)).toBe(0)
        expect(staggerDelay(1)).toBe(90)
        expect(staggerDelay(3)).toBe(270)
    })
    it('caps at 360ms so long lists do not crawl', () => {
        expect(staggerDelay(4)).toBe(360)
        expect(staggerDelay(12)).toBe(360)
    })
})

describe('shouldAnimate', () => {
    it('animates only when motion is allowed and IO is supported', () => {
        expect(shouldAnimate({ reducedMotion: false, io: true })).toBe(true)
    })
    it('skips choreography for prefers-reduced-motion', () => {
        expect(shouldAnimate({ reducedMotion: true, io: true })).toBe(false)
    })
    it('skips when IntersectionObserver is unavailable (content stays visible)', () => {
        expect(shouldAnimate({ reducedMotion: false, io: false })).toBe(false)
    })
})

describe('splitToWordSpans', () => {
    it('wraps each word in a masked span pair', () => {
        const html = splitToWordSpans('Esteticaura Love')
        expect(html).toBe(
            '<span class="hero__word"><span class="hero__word-inner">Esteticaura</span></span> ' +
            '<span class="hero__word"><span class="hero__word-inner">Love</span></span>'
        )
    })
    it('collapses stray whitespace instead of producing empty words', () => {
        const html = splitToWordSpans('  Один   два ')
        const words = html.match(/hero__word-inner/g)
        expect(words).toHaveLength(2)
    })
    it('escapes HTML so markup in the source text cannot inject elements', () => {
        const html = splitToWordSpans('<img src=x onerror=alert(1)>')
        expect(html).not.toContain('<img')
        expect(html).toContain('&lt;img')
    })
})
