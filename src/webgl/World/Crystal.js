import * as THREE from 'three'

// Scroll-target object: a polished GOLD brilliant-cut gem (pavilion + crown).
// NO transmission (renders opaque through bloom / on weak GPUs). The premium look comes
// from a sharp metallic mirror (low roughness) reflecting the golden-noir environment +
// flat-shaded facets + slow organic motion. The old "cheap 90s" look was flat color with
// no reflections + a fast uniform spin — both fixed here.
export default class Crystal {
    constructor(experience) {
        this.scene = experience.scene

        this.material = new THREE.MeshPhysicalMaterial({
            color: '#E8C457',       // brighter gold base so shadowed facets still read gold
            metalness: 1,
            roughness: 0.28,        // softer facets — even gold sheen, less blown highlight
            flatShading: true,
            clearcoat: 0.5,
            clearcoatRoughness: 0.1,
            envMapIntensity: 1.3
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
        // Slow, refined rotation + gentle sway — avoids the cheap uniform-spin look.
        this.mesh.rotation.y = elapsedTime * 0.12
        this.mesh.rotation.z = Math.sin(elapsedTime * 0.5) * 0.08
    }
}
