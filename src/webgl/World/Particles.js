import * as THREE from 'three'

// Gold dust: 5000 additive round sprites (procedural circular alpha mask, no asset file).
export default class Particles {
    constructor(experience) {
        this.scene = experience.scene
        this.count = 5000
        this.baseSize = 0.15

        this.setGeometry()
        this.setMaterial()
        this.setPoints()
    }

    setGeometry() {
        this.geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(this.count * 3)
        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3
            positions[i3] = (Math.random() - 0.5) * 25
            positions[i3 + 1] = (Math.random() - 0.5) * 25
            positions[i3 + 2] = (Math.random() - 0.5) * 25
        }
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
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
            color: '#D4AF37',
            map: this.createCircleTexture(),
            size: this.baseSize,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.6
        })
    }

    setPoints() {
        this.points = new THREE.Points(this.geometry, this.material)
        this.scene.add(this.points)
    }

    update(elapsedTime) {
        this.points.rotation.y = elapsedTime * 0.05
        this.points.rotation.x = elapsedTime * 0.02
        // Soft shimmer via size pulse (opacity is reserved for the morph flash in World).
        this.material.size = this.baseSize + Math.sin(elapsedTime * 2) * 0.03
    }
}
