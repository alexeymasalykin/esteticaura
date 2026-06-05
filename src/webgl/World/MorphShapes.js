import * as THREE from 'three'

export default class MorphShapes {
    constructor(experience) {
        this.experience = experience
        this.scene = this.experience.scene

        this.group = new THREE.Group()
        this.scene.add(this.group)

        this.createDrop()
        this.createCrystal()

        // Hide initially
        this.drop.visible = false
        this.crystal.visible = false
    }

    createDrop() {
        const geometry = new THREE.SphereGeometry(1, 64, 64)
        const material = new THREE.MeshPhysicalMaterial({
            color: '#ffffff',
            metalness: 0.1,
            roughness: 0,
            transmission: 0.9, // Glass/Water
            thickness: 1,
            clearcoat: 1,
            clearcoatRoughness: 0
        })
        this.drop = new THREE.Mesh(geometry, material)
        this.drop.position.set(0, 0, 0)
        this.group.add(this.drop)
    }

    createCrystal() {
        const geometry = new THREE.IcosahedronGeometry(1, 0)
        const material = new THREE.MeshPhysicalMaterial({
            color: '#F7E7CE', // Champagne
            metalness: 0.9,
            roughness: 0.1,
            flatShading: true
        })
        this.crystal = new THREE.Mesh(geometry, material)
        this.crystal.position.set(0, 0, 0)
        this.group.add(this.crystal)
    }

    update(elapsedTime) {
        if (this.drop.visible) {
            this.drop.rotation.y = elapsedTime * 0.2
            this.drop.position.y = Math.sin(elapsedTime) * 0.2
            // Stretch to look like a drop
            this.drop.scale.y = 1 + Math.sin(elapsedTime * 2) * 0.1
        }
        if (this.crystal.visible) {
            this.crystal.rotation.x = elapsedTime * 0.3
            this.crystal.rotation.y = elapsedTime * 0.3
        }
    }
}
