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
