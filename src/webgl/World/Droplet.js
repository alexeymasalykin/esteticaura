import * as THREE from 'three'

// Hero object: expensive glass/water droplet (reference board §2.1).
// Requires scene.environment (set by Environment) — transmission needs an env map.
export default class Droplet {
    constructor(experience) {
        this.scene = experience.scene

        const geometry = new THREE.SphereGeometry(1, 64, 64)
        this.material = new THREE.MeshPhysicalMaterial({
            color: '#ffffff',
            transmission: 1,
            thickness: 0.6,        // required for refraction at this object scale
            roughness: 0.04,       // 0–0.15 polished glass; 0.2–0.6 pixelates — avoid
            ior: 1.5,              // glass/crystal — crisper refraction & sparkle than water
            clearcoat: 1,
            clearcoatRoughness: 0,
            iridescence: 0.1,      // reduced: avoids the milky/murky look
            attenuationColor: '#F7E7CE',  // champagne tint of light passing through (not flat white)
            attenuationDistance: 0.8
        })
        this.mesh = new THREE.Mesh(geometry, this.material)
        this.mesh.position.set(0, 0, 0)
        this.scene.add(this.mesh)
    }

    update(elapsedTime) {
        if (!this.mesh.visible) return
        // Pause self-animation while the scroll morph shrinks us (scale.x < ~1):
        // prevents the breathing scale.y from fighting the morph tween (Phase A carry-forward).
        if (this.mesh.scale.x < 0.99) return

        this.mesh.rotation.y = elapsedTime * 0.2
        this.mesh.position.y = Math.sin(elapsedTime) * 0.2
        this.mesh.scale.y = 1 + Math.sin(elapsedTime * 2) * 0.1
    }
}
