import * as THREE from 'three'

// Scroll-target object: faceted brilliant-cut gem (pavilion + crown), gold metal.
// A Group of two flat-shaded cones reads as a real cut gemstone (vs. a plain d20).
// Starts at scale 0 (invisible), scaled in by the morph — fully reversible on scroll-up.
export default class Crystal {
    constructor(experience) {
        this.scene = experience.scene

        this.material = new THREE.MeshPhysicalMaterial({
            color: '#F7E7CE',      // champagne base; env map paints the gold reflections
            metalness: 1,
            roughness: 0.15,
            flatShading: true,     // sharp facets
            envMapIntensity: 1.4
        })

        this.mesh = new THREE.Group()

        // Pavilion: 8-sided cone, apex pointing down; girdle (radius 1) at y = 0.
        const pavilion = new THREE.Mesh(new THREE.ConeGeometry(1, 1.3, 8), this.material)
        pavilion.rotation.x = Math.PI
        pavilion.position.y = -0.65
        this.mesh.add(pavilion)

        // Crown: truncated 8-sided cone with a flat table on top; bottom (girdle) at y = 0.
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1, 0.5, 8), this.material)
        crown.position.y = 0.25
        this.mesh.add(crown)

        this.mesh.position.set(0, 0, 0)
        this.mesh.scale.set(0, 0, 0)   // invisible until the morph scales it in
        this.scene.add(this.mesh)
    }

    update(elapsedTime) {
        this.mesh.rotation.y = elapsedTime * 0.3
        this.mesh.rotation.x = elapsedTime * 0.15
    }
}
