import { describe, it, expect } from 'vitest'
import { progressFraction } from './ScrollProgress.js'

describe('progressFraction', () => {
    it('maps scroll position to 0..1', () => {
        expect(progressFraction(0, 2000)).toBe(0)
        expect(progressFraction(1000, 2000)).toBe(0.5)
        expect(progressFraction(2000, 2000)).toBe(1)
    })
    it('clamps overshoot (rubber-band scrolling)', () => {
        expect(progressFraction(-50, 2000)).toBe(0)
        expect(progressFraction(2400, 2000)).toBe(1)
    })
    it('returns 0 when the page does not scroll at all', () => {
        expect(progressFraction(0, 0)).toBe(0)
        expect(progressFraction(100, 0)).toBe(0)
    })
})
