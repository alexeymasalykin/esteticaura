import { describe, it, expect } from 'vitest'
import { buildDiamondPoints, buildScatter } from './diamondPoints.js'

const COUNT = 2000
const SIZE = 1.8
const EDGE_RATIO = 0.28

describe('buildDiamondPoints', () => {
    const built = buildDiamondPoints({ count: COUNT, size: SIZE, edgeRatio: EDGE_RATIO })

    it('returns attribute arrays sized to the particle count', () => {
        expect(built.targets).toHaveLength(COUNT * 3)
        expect(built.colors).toHaveLength(COUNT * 3)
        expect(built.isEdge).toHaveLength(COUNT)
        expect(built.scales).toHaveLength(COUNT)
        expect(built.phases).toHaveLength(COUNT)
        expect(built.delays).toHaveLength(COUNT)
    })

    it('centers the diamond vertically (symmetric bounding box around y=0)', () => {
        let minY = Infinity
        let maxY = -Infinity
        for (let i = 0; i < COUNT; i++) {
            const y = built.targets[i * 3 + 1]
            if (y < minY) minY = y
            if (y > maxY) maxY = y
        }
        const height = maxY - minY
        expect(Math.abs(maxY + minY)).toBeLessThan(height * 0.05)
    })

    it('fits within the requested size (width 2*size, height ~1.37*size)', () => {
        let maxR = 0
        let minY = Infinity
        let maxY = -Infinity
        for (let i = 0; i < COUNT; i++) {
            const x = built.targets[i * 3]
            const y = built.targets[i * 3 + 1]
            const z = built.targets[i * 3 + 2]
            maxR = Math.max(maxR, Math.hypot(x, z))
            if (y < minY) minY = y
            if (y > maxY) maxY = y
        }
        expect(maxR).toBeLessThanOrEqual(SIZE + 1e-6)
        expect(maxY - minY).toBeLessThanOrEqual(1.37 * SIZE + 1e-6)
        expect(maxY - minY).toBeGreaterThan(1.2 * SIZE) // actually reaches culet/table
    })

    it('allocates the requested share of particles to facet edges', () => {
        const edgeCount = built.isEdge.reduce((s, v) => s + v, 0)
        expect(edgeCount).toBe(Math.round(COUNT * EDGE_RATIO))
    })

    it('places edge particles exactly on facet edge segments', () => {
        const { edges } = built.mesh
        const onSegment = (px, py, pz) => edges.some(([a, b]) => {
            const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z
            const apx = px - a.x, apy = py - a.y, apz = pz - a.z
            const len2 = abx * abx + aby * aby + abz * abz
            const t = (apx * abx + apy * aby + apz * abz) / len2
            if (t < -1e-4 || t > 1 + 1e-4) return false
            const dx = apx - abx * t, dy = apy - aby * t, dz = apz - abz * t
            return Math.hypot(dx, dy, dz) < 1e-4
        })
        let checked = 0
        for (let i = 0; i < COUNT && checked < 50; i++) {
            if (!built.isEdge[i]) continue
            checked++
            expect(onSegment(built.targets[i * 3], built.targets[i * 3 + 1], built.targets[i * 3 + 2])).toBe(true)
        }
        expect(checked).toBe(50)
    })

    it('staggers arrival: delays span [0, 0.65] so all arrive by progress 1', () => {
        let min = Infinity
        let max = -Infinity
        for (const d of built.delays) {
            if (d < min) min = d
            if (d > max) max = d
        }
        expect(min).toBeGreaterThanOrEqual(0)
        expect(max).toBeLessThanOrEqual(0.65)
        expect(max - min).toBeGreaterThan(0.4) // actually spread, not constant
    })

    it('varies particle scale and makes edge particles read brighter (larger) than faces', () => {
        let edgeSum = 0, edgeN = 0, faceSum = 0, faceN = 0
        for (let i = 0; i < COUNT; i++) {
            expect(built.scales[i]).toBeGreaterThan(0.3)
            expect(built.scales[i]).toBeLessThan(2)
            if (built.isEdge[i]) { edgeSum += built.scales[i]; edgeN++ }
            else { faceSum += built.scales[i]; faceN++ }
        }
        expect(edgeSum / edgeN).toBeGreaterThan(faceSum / faceN)
    })

    it('uses a gold/champagne/white palette (white sparkles are a small minority)', () => {
        const seen = new Set()
        let white = 0
        for (let i = 0; i < COUNT; i++) {
            const r = built.colors[i * 3], g = built.colors[i * 3 + 1], b = built.colors[i * 3 + 2]
            expect(r).toBeGreaterThanOrEqual(0)
            expect(r).toBeLessThanOrEqual(1)
            expect(g).toBeGreaterThanOrEqual(0)
            expect(g).toBeLessThanOrEqual(1)
            expect(b).toBeGreaterThanOrEqual(0)
            expect(b).toBeLessThanOrEqual(1)
            seen.add(`${r.toFixed(3)},${g.toFixed(3)},${b.toFixed(3)}`)
            if (r > 0.99 && g > 0.99 && b > 0.99) white++
        }
        expect(seen.size).toBeGreaterThanOrEqual(3) // gold + champagne + white at least
        expect(white / COUNT).toBeGreaterThan(0.01)
        expect(white / COUNT).toBeLessThan(0.2)
    })
})

describe('buildScatter', () => {
    it('fills the requested spread around the origin', () => {
        const spread = 26
        const scatter = buildScatter({ count: COUNT, spread })
        expect(scatter).toHaveLength(COUNT * 3)
        let maxAbs = 0
        for (const v of scatter) maxAbs = Math.max(maxAbs, Math.abs(v))
        expect(maxAbs).toBeLessThanOrEqual(spread / 2)
        expect(maxAbs).toBeGreaterThan(spread / 4) // actually uses the volume
    })
})
