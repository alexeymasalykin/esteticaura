import * as THREE from 'three'

// Hero object: a water/serum droplet — teardrop silhouette, dewy pearlescent glass.
// NO transmission (it renders opaque through EffectComposer/bloom and on weak GPUs):
// the "glass" comes from a polished clearcoat + iridescent sheen + strong env reflections
// + light translucency. Robust on every GPU and verifiable in headless.
export default class Droplet {
    constructor(experience) {
        this.scene = experience.scene

        const geometry = this.createTeardropGeometry()
        this.material = new THREE.MeshPhysicalMaterial({
            color: '#ffffff',
            metalness: 0,
            roughness: 0.02,
            clearcoat: 1,
            clearcoatRoughness: 0,
            transparent: true,
            opacity: 0.6,
            iridescence: 0.5,
            iridescenceIOR: 1.6,
            envMapIntensity: 2.5
        })
        this.mesh = new THREE.Mesh(geometry, this.material)
        this.mesh.position.set(0, 0, 0)
        this.scene.add(this.mesh)
    }

    // Teardrop profile (radius, height) lathed around Y: rounded bottom, pointed top.
    createTeardropGeometry() {
        const profile = [
            [0.001, -0.80],
            [0.28, -0.74],
            [0.50, -0.56],
            [0.63, -0.30],
            [0.68, 0.00],   // widest
            [0.62, 0.32],
            [0.48, 0.62],
            [0.30, 0.86],
            [0.14, 1.08],
            [0.001, 1.25]   // top point
        ]
        const points = profile.map(([r, y]) => new THREE.Vector2(r, y))
        const geometry = new THREE.LatheGeometry(points, 64)
        geometry.computeVertexNormals()
        return geometry
    }

    update(elapsedTime) {
        if (!this.mesh.visible) return
        // Pause self-animation while the scroll morph shrinks us (Phase A carry-forward).
        if (this.mesh.scale.x < 0.99) return

        // Weighted, settled motion: a small bob + gentle surface-tension sway. No spin.
        this.mesh.position.y = Math.sin(elapsedTime * 1.4) * 0.05
        this.mesh.rotation.z = Math.sin(elapsedTime * 0.7) * 0.04
    }
}
