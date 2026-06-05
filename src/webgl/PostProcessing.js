import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

// Gold glow on bright highlights/particles. Desktop-only in Phase C (expensive pass).
// OutputPass MUST be last: it takes over tone mapping (board §note 1).
export default class PostProcessing {
    constructor(experience) {
        this.experience = experience
        this.enabled = window.matchMedia('(min-width: 1024px)').matches
        if (!this.enabled) return

        const { renderer, scene, camera, sizes } = experience

        this.composer = new EffectComposer(renderer)
        this.composer.setSize(sizes.width, sizes.height)
        this.composer.setPixelRatio(sizes.pixelRatio)

        this.composer.addPass(new RenderPass(scene, camera))

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(sizes.width, sizes.height),
            0.38,  // strength — tuned (gold on black, conservative)
            0.43,  // radius — tuned (tighter glow)
            0.1    // threshold
        )
        this.composer.addPass(this.bloomPass)

        this.composer.addPass(new OutputPass())
    }

    resize() {
        if (!this.enabled) return
        this.composer.setSize(this.experience.sizes.width, this.experience.sizes.height)
        this.composer.setPixelRatio(this.experience.sizes.pixelRatio)
    }

    render() {
        this.composer.render()
    }
}
