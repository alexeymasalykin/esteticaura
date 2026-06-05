import * as THREE from 'three'

// Scroll-target object: a transparent brilliant-cut DIAMOND (pavilion + crown).
// Clear refractive glass with a high IOR + gold attenuation → it refracts the golden-noir
// environment ("golden diamond"). Flat-shaded facets give per-face sparkle. Slow, organic
// motion (not a uniform screensaver spin). Scale 0 until the morph scales it in (reversible).
export default class Crystal {
    constructor(experience) {
        this.scene = experience.scene

        this.material = new THREE.MeshPhysicalMaterial({
            color: '#ffffff',
            metalness: 0,
            roughness: 0.0,
            transmission: 1,
            thickness: 1.0,
            ior: 2.2,                      // diamond-like → strong refraction & sparkle
            clearcoat: 1,
            clearcoatRoughness: 0,
            flatShading: true,             // sharp facets refract per-face
            iridescence: 0.3,              // a hint of fire/dispersion
            envMapIntensity: 1.5,
            attenuationColor: '#D4AF37',   // refracted light picks up gold → golden diamond
            attenuationDistance: 1.2
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
