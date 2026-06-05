import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

// Procedural image-based lighting (no HDRI file) + key/fill lights.
// Gives real reflections to the glass droplet and gold crystal.
export default class Environment {
    constructor(experience) {
        this.scene = experience.scene
        this.renderer = experience.renderer

        this.setEnvironmentMap()
        this.setLights()
    }

    setEnvironmentMap() {
        const pmrem = new THREE.PMREMGenerator(this.renderer)
        this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
        this.scene.environment = this.envMap
        pmrem.dispose()
    }

    setLights() {
        this.ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
        this.scene.add(this.ambientLight)

        this.directionalLight = new THREE.DirectionalLight('#D4AF37', 2)
        this.directionalLight.position.set(5, 5, 5)
        this.scene.add(this.directionalLight)

        this.spotLight = new THREE.SpotLight('#F7E7CE', 5, 20, Math.PI * 0.3, 0.5, 1)
        this.spotLight.position.set(0, 5, 2)
        this.spotLight.target.position.set(0, 0, 0)
        this.scene.add(this.spotLight)
        this.scene.add(this.spotLight.target)
    }
}
