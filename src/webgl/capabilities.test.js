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
