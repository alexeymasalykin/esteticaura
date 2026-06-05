import { describe, it, expect } from 'vitest'
import { decideMode } from './capabilities.js'

describe('decideMode', () => {
    it('renders 3d on a capable, motion-OK device (incl. mobile)', () => {
        expect(decideMode({ reducedMotion: false, webgl: true })).toBe('3d')
    })
    it('falls back to poster when reduced motion is requested', () => {
        expect(decideMode({ reducedMotion: true, webgl: true })).toBe('poster')
    })
    it('falls back to poster when WebGL is unavailable', () => {
        expect(decideMode({ reducedMotion: false, webgl: false })).toBe('poster')
    })
    it('falls back to poster when both reduced-motion and no WebGL', () => {
        expect(decideMode({ reducedMotion: true, webgl: false })).toBe('poster')
    })
})
