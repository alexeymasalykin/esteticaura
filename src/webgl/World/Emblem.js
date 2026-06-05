import * as THREE from 'three'
import gsap from 'gsap'

export default class Emblem {
    constructor(experience) {
        this.experience = experience
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.time = 0

        this.setGeometry()
        this.setTexture()
        this.setMaterial()
        this.setMesh()
    }

    setGeometry() {
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 1
        }

        if (this.texture) {
            materialOptions.map = this.texture
        } else {
            materialOptions.color = '#D4AF37'
            materialOptions.blending = THREE.NormalBlending // Normal blending for fallback so it's visible
        }

        this.material = new THREE.MeshBasicMaterial(materialOptions)
    }


    setMesh() {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.scene.add(this.mesh)
    }

    update(elapsedTime) {
        this.time = elapsedTime

        // Gentle floating
        this.mesh.position.y = Math.sin(this.time * 0.5) * 0.1

        // Gentle rotation
        this.mesh.rotation.y = Math.sin(this.time * 0.2) * 0.1
        this.mesh.rotation.z = Math.sin(this.time * 0.1) * 0.05
    }
}
