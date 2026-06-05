import * as THREE from 'three'

// Scroll-target object: faceted gold crystal. Hidden until scroll morph.
export default class Crystal {
    constructor(experience) {
        this.scene = experience.scene

        const geometry = new THREE.IcosahedronGeometry(1, 0)
        const material = new THREE.MeshPhysicalMaterial({
            color: '#F7E7CE',
            metalness: 0.9,
            roughness: 0.1,
            flatShading: true
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.set(0, 0, 0)
        this.mesh.visible = false
        this.scene.add(this.mesh)
    }

    update(elapsedTime) {
        if (!this.mesh.visible) return
        this.mesh.rotation.x = elapsedTime * 0.3
        this.mesh.rotation.y = elapsedTime * 0.3
    }
}
