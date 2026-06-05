import * as THREE from 'three'

// Procedural golden-noir image-based lighting (no HDRI, no white studio room):
// a dark scene with warm gold / champagne emissive panels → rich warm reflections
// on the glass droplet and the gold crystal. Plus direct lights for shape.
export default class Environment {
    constructor(experience) {
        this.scene = experience.scene
        this.renderer = experience.renderer

        this.setEnvironmentMap()
        this.setLights()
    }

    setEnvironmentMap() {
        const pmrem = new THREE.PMREMGenerator(this.renderer)

        const envScene = new THREE.Scene()
        envScene.background = new THREE.Color('#050505')

        // Emissive panels (HDR-ish via color * intensity) act as area lights for the IBL.
        const addPanel = (color, intensity, position, size) => {
            const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
            material.color.multiplyScalar(intensity)
            const panel = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), material)
            panel.position.set(position[0], position[1], position[2])
            panel.lookAt(0, 0, 0)
            envScene.add(panel)
        }

        addPanel('#D4AF37', 5.0, [6, 3, 4], [9, 9])     // gold key
        addPanel('#F7E7CE', 2.5, [-5, 2, -3], [7, 7])   // champagne fill
        addPanel('#3A2F10', 1.2, [0, -5, 3], [12, 12])  // warm dark floor bounce
        addPanel('#FFFFFF', 0.8, [-2, 6, -4], [3, 3])   // small white sparkle highlight

        this.envMap = pmrem.fromScene(envScene, 0.04).texture
        this.scene.environment = this.envMap

        // PMREM has captured the scene — release the temporary geometry/materials.
        envScene.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose()
            if (obj.material) obj.material.dispose()
        })
        pmrem.dispose()
    }

    setLights() {
        // Low neutral ambient so the warm env dominates (was 0.5 white = washed out).
        this.ambientLight = new THREE.AmbientLight('#ffffff', 0.15)
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
