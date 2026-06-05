import * as THREE from 'three'
import { isMobile } from '../capabilities.js'

// Gold dust that doubles as the hero object. Each particle has two homes: a scattered
// ambient position (hero dust field) and a target point on the SURFACE of a round
// brilliant-cut diamond. Scroll lerps the cloud scatter -> diamond, so the dust literally
// assembles into a glittering diamond made of light (no solid mesh → no cheap low-poly
// look, and no transmission needed).
export default class Particles {
    constructor(experience) {
        this.experience = experience
        this.scene = experience.scene
        // Lighter particle budget on phones (fits the smaller diamond + saves the GPU).
        this.count = isMobile() ? 3800 : 6300
        this.baseSize = 0.13
        this.progress = 0

        this.scatter = this.generateScatter()
        this.diamond = this.generateDiamondSurface()

        this.setGeometry()
        this.setMaterial()
        this.setPoints()
    }

    generateScatter() {
        const a = new Float32Array(this.count * 3)
        for (let i = 0; i < this.count * 3; i++) a[i] = (Math.random() - 0.5) * 26
        return a
    }

    // Area-weighted sample of points across a round brilliant-cut diamond surface (16-fold:
    // table + two crown facet rings + girdle + two pavilion rings to a culet).
    generateDiamondSurface() {
        const N = 16
        const S = 2.4 // overall diamond size
        const TWO_PI = Math.PI * 2
        const V = []
        const ring = (r, y) => {
            const start = V.length
            for (let i = 0; i < N; i++) {
                const a = (i / N) * TWO_PI
                V.push(new THREE.Vector3(Math.cos(a) * r * S, y * S, Math.sin(a) * r * S))
            }
            return start
        }
        const tableC = V.length; V.push(new THREE.Vector3(0, 0.42 * S, 0))
        const T = ring(0.50, 0.42)
        const B = ring(0.80, 0.24)
        const G = ring(1.00, 0.00)
        const P = ring(0.55, -0.45)
        const culet = V.length; V.push(new THREE.Vector3(0, -0.95 * S, 0))

        const nx = (i) => (i + 1) % N
        const tris = []
        const tri = (a, b, c) => tris.push([V[a], V[b], V[c]])
        for (let i = 0; i < N; i++) tri(tableC, T + i, T + nx(i))
        const band = (A, Bn) => {
            for (let i = 0; i < N; i++) {
                tri(A + i, Bn + i, Bn + nx(i))
                tri(A + i, Bn + nx(i), A + nx(i))
            }
        }
        band(T, B); band(B, G); band(G, P)
        for (let i = 0; i < N; i++) tri(P + i, culet, P + nx(i))

        const areas = tris.map(([a, b, c]) => {
            const ab = new THREE.Vector3().subVectors(b, a)
            const ac = new THREE.Vector3().subVectors(c, a)
            return new THREE.Vector3().crossVectors(ab, ac).length() * 0.5
        })
        const total = areas.reduce((s, a) => s + a, 0)
        const cum = []
        let acc = 0
        for (const ar of areas) { acc += ar; cum.push(acc / total) }

        const out = new Float32Array(this.count * 3)
        const edge1 = new THREE.Vector3()
        const edge2 = new THREE.Vector3()
        const pt = new THREE.Vector3()
        for (let i = 0; i < this.count; i++) {
            const r = Math.random()
            let t = 0
            while (t < cum.length - 1 && r > cum[t]) t++
            const [a, b, c] = tris[t]
            let u = Math.random(); let v = Math.random()
            if (u + v > 1) { u = 1 - u; v = 1 - v }
            edge1.subVectors(b, a)
            edge2.subVectors(c, a)
            pt.copy(a).addScaledVector(edge1, u).addScaledVector(edge2, v)
            const i3 = i * 3
            out[i3] = pt.x; out[i3 + 1] = pt.y; out[i3 + 2] = pt.z
        }
        return out
    }

    setGeometry() {
        this.geometry = new THREE.BufferGeometry()
        // Live positions start at the scattered field (copy — we mutate it each frame).
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.scatter.slice(), 3))
    }

    // Procedural soft circle (radial gradient) → round particles instead of squares.
    createCircleTexture() {
        const size = 64
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
        g.addColorStop(0, 'rgba(255,255,255,1)')
        g.addColorStop(0.4, 'rgba(255,255,255,0.6)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, size, size)
        const texture = new THREE.CanvasTexture(canvas)
        texture.colorSpace = THREE.SRGBColorSpace
        return texture
    }

    setMaterial() {
        this.material = new THREE.PointsMaterial({
            color: '#F1D78A',
            map: this.createCircleTexture(),
            size: this.baseSize,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.7
        })
    }

    setPoints() {
        this.points = new THREE.Points(this.geometry, this.material)
        this.scene.add(this.points)
    }

    // Driven by the scroll timeline (0 = scattered dust, 1 = assembled diamond).
    setProgress(p) {
        this.progress = p
    }

    update(elapsedTime) {
        // Lerp every particle scatter -> diamond by an eased progress (smoothstep).
        const p = this.progress
        const e = p * p * (3 - 2 * p)
        // Responsive fit: a wide diamond overflows narrow / portrait screens, so shrink the
        // diamond target on low aspect ratios (the ambient scatter field is left full-bleed).
        const aspect = this.experience.sizes.width / this.experience.sizes.height
        const fit = Math.min(1, Math.max(0.42, aspect / 1.15))
        const pos = this.geometry.attributes.position.array
        const s = this.scatter
        const d = this.diamond
        for (let i = 0; i < pos.length; i++) pos[i] = s[i] + (d[i] * fit - s[i]) * e
        this.geometry.attributes.position.needsUpdate = true

        // Slow rotation (ambient drift / shows the assembled diamond in 3D) + size shimmer.
        this.points.rotation.y = elapsedTime * 0.06
        this.material.size = this.baseSize + Math.sin(elapsedTime * 2) * 0.025
    }
}
