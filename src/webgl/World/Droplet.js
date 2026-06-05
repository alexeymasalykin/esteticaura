import * as THREE from 'three'

// Hero object: glass/water droplet. Studio-grade params land in Phase C;
// these are the working baseline carried over from MorphShapes.
export default class Droplet {
    constructor(experience) {
        this.scene = experience.scene

        const geometry = new THREE.SphereGeometry(1, 64, 64)
        const material = new THREE.MeshPhysicalMaterial({
            color: '#ffffff',
            metalness: 0.1,
            roughness: 0,
            transmission: 0.9,
            thickness: 1,
            clearcoat: 1,
            clearcoatRoughness: 0
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.set(0, 0, 0)
        this.scene.add(this.mesh)
    }

    update(elapsedTime) {
        if (!this.mesh.visible) return
        this.mesh.rotation.y = elapsedTime * 0.2
        this.mesh.position.y = Math.sin(elapsedTime) * 0.2
        this.mesh.scale.y = 1 + Math.sin(elapsedTime * 2) * 0.1
    }
}
