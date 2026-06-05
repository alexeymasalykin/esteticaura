import * as THREE from 'three'

// Scroll-target object: a many-faceted round BRILLIANT-CUT diamond.
// Custom geometry: flat table + two crown facet rings + girdle + two pavilion rings to a
// culet (16-fold) → reads like a real diamond, not a chunky 8-sided cone. Bright silvery
// metal (no transmission — that renders opaque under bloom / on weak GPUs); the golden-noir
// env paints warm sparkle on the facets. DoubleSide shows inner facet reflections (diamond fire).
export default class Crystal {
    constructor(experience) {
        this.scene = experience.scene

        this.material = new THREE.MeshPhysicalMaterial({
            color: '#EBEDF2',       // near-colourless diamond; env tints it warm
            metalness: 0.9,
            roughness: 0.12,        // softer facets — sparkle without blown-white blobs
            flatShading: true,
            clearcoat: 1,
            clearcoatRoughness: 0.04,
            envMapIntensity: 1.8,
            side: THREE.DoubleSide
        })

        this.mesh = new THREE.Mesh(this.buildBrilliantGeometry(), this.material)
        this.mesh.position.set(0, 0, 0)
        this.mesh.scale.set(0, 0, 0)   // invisible until the morph scales it in
        this.scene.add(this.mesh)
    }

    // Parametric round brilliant cut (N-fold). Rings of vertices stacked by height/radius,
    // stitched into facet bands. flatShading on the material makes every facet read sharp.
    buildBrilliantGeometry() {
        const N = 16
        const TWO_PI = Math.PI * 2
        const verts = []
        const ring = (r, y) => {
            const start = verts.length / 3
            for (let i = 0; i < N; i++) {
                const a = (i / N) * TWO_PI
                verts.push(Math.cos(a) * r, y, Math.sin(a) * r)
            }
            return start
        }

        const tableCenter = verts.length / 3; verts.push(0, 0.42, 0)
        const T = ring(0.50, 0.42)   // table edge
        const B = ring(0.80, 0.24)   // crown bezel
        const G = ring(1.00, 0.00)   // girdle (widest)
        const P = ring(0.55, -0.45)  // pavilion mid
        const culet = verts.length / 3; verts.push(0, -0.95, 0)

        const idx = []
        const nx = (i) => (i + 1) % N
        const band = (A, Bn) => {
            for (let i = 0; i < N; i++) {
                idx.push(A + i, Bn + i, Bn + nx(i))
                idx.push(A + i, Bn + nx(i), A + nx(i))
            }
        }
        for (let i = 0; i < N; i++) idx.push(tableCenter, T + i, T + nx(i)) // table cap
        band(T, B)                                                          // crown row 1
        band(B, G)                                                          // crown row 2
        band(G, P)                                                          // pavilion row 1
        for (let i = 0; i < N; i++) idx.push(P + i, culet, P + nx(i))       // pavilion tip

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
        geometry.setIndex(idx)
        geometry.computeVertexNormals()
        return geometry
    }

    update(elapsedTime) {
        // Slow, refined rotation + gentle sway — avoids the cheap uniform-spin look.
        this.mesh.rotation.y = elapsedTime * 0.12
        this.mesh.rotation.z = Math.sin(elapsedTime * 0.5) * 0.08
    }
}
