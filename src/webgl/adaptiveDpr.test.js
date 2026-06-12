import { describe, it, expect } from 'vitest'
import { nextPixelRatio, SLOW_FRAME_MS } from './adaptiveDpr.js'

describe('nextPixelRatio', () => {
    it('steps down 2 -> 1.5 when frames are slow', () => {
        expect(nextPixelRatio(2, 28)).toBe(1.5)
    })
    it('keeps stepping down through 1.25 to the floor of 1', () => {
        expect(nextPixelRatio(1.5, 30)).toBe(1.25)
        expect(nextPixelRatio(1.25, 30)).toBe(1)
    })
    it('returns null at the floor even when still slow', () => {
        expect(nextPixelRatio(1, 40)).toBeNull()
    })
    it('returns null when frame time is acceptable', () => {
        expect(nextPixelRatio(2, SLOW_FRAME_MS)).toBeNull()
        expect(nextPixelRatio(2, 16.7)).toBeNull()
    })
    it('snaps an off-grid ratio to the next lower step', () => {
        expect(nextPixelRatio(1.75, 30)).toBe(1.5)
    })
})
