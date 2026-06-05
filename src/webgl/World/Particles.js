import * as THREE from 'three'

export default class Particles {
    constructor(experience) {
        this.scene = experience.scene
        this.count = 5000

        this.setGeometry()
        this.setMaterial()
        this.setPoints()
    }

    setGeometry() {
        this.geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(this.count * 3)
        const scales = new Float32Array(this.count)
        const randomness = new Float32Array(this.count * 3)

        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3

            // Random position in a large box
            positions[i3] = (Math.random() - 0.5) * 25
            positions[i3 + 1] = (Math.random() - 0.5) * 25
            positions[i3 + 2] = (Math.random() - 0.5) * 25

            scales[i] = Math.random()

            randomness[i3] = (Math.random() - 0.5)
            randomness[i3 + 1] = (Math.random() - 0.5)
            randomness[i3 + 2] = (Math.random() - 0.5)
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
        this.geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3))
    }

    setMaterial() {
        this.material = new THREE.PointsMaterial({
            color: '#D4AF37',
            size: 0.15,
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
        // Animate particles
        this.points.rotation.y = elapsedTime * 0.05
        this.points.rotation.x = elapsedTime * 0.02
    }
}
