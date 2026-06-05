import * as THREE from 'three'

export default class Lights {
    constructor(experience) {
        this.scene = experience.scene

        // Ambient Light
        this.ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
        this.scene.add(this.ambientLight)

        // Directional Light (Sun/Gold glow)
        this.directionalLight = new THREE.DirectionalLight('#D4AF37', 2)
        this.directionalLight.position.set(5, 5, 5)
        this.scene.add(this.directionalLight)

        // SpotLight (Focus)
        this.spotLight = new THREE.SpotLight('#F7E7CE', 5, 20, Math.PI * 0.3, 0.5, 1)
        this.spotLight.position.set(0, 5, 2)
        this.spotLight.target.position.set(0, 0, 0)
        this.scene.add(this.spotLight)
        this.scene.add(this.spotLight.target)
    }
}
