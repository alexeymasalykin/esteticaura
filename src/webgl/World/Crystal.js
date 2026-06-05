import * as THREE from 'three'

// Scroll-target object: faceted gold crystal (reference board §2.2).
// Starts at scale 0 (invisible) and is scaled in by the morph — fully reversible on scroll-up.
export default class Crystal {
    constructor(experience) {
        this.scene = experience.scene

        const geometry = new THREE.IcosahedronGeometry(1, 0)
        this.material = new THREE.MeshPhysicalMaterial({
            color: '#F7E7CE',      // champagne base; env map paints the gold reflections
            metalness: 1,
            roughness: 0.15,
            flatShading: true,
            envMapIntensity: 1.2
        })
        this.mesh = new THREE.Mesh(geometry, this.material)
        this.mesh.position.set(0, 0, 0)
        this.mesh.scale.set(0, 0, 0)   // invisible until the morph scales it in
        this.scene.add(this.mesh)
    }

    update(elapsedTime) {
        this.mesh.rotation.x = elapsedTime * 0.3
        this.mesh.rotation.y = elapsedTime * 0.3
    }
}
