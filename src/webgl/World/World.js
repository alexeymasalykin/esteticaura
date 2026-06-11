import Environment from '../Environment.js'
import Particles from './Particles.js'
import gsap from 'gsap'

export default class World {
    constructor(experience) {
        this.experience = experience
        this.scene = this.experience.scene
        this.morph = { progress: 0 }

        // Environment first — sets scene.environment used by PBR materials.
        this.environment = new Environment(this.experience)
        this.particles = new Particles(this.experience)

        this.setupScrollAnimations()
    }

    update(elapsedTime) {
        if (this.particles) this.particles.update(elapsedTime)
    }

    setupScrollAnimations() {
        // Choreography in three acts, fully reversible (scrub):
        //   1. hero: gold dust drifts free;
        //   2. ~1/3 down the page the dust swarms into a brilliant-cut diamond
        //      with a burst + bloom flash;
        //   3. past the showcase the diamond shrinks, drifts top-right and dims,
        //      clearing the stage for booking/contacts content.
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1
            }
        })
        // Total timeline length ~3 (camera) → the diamond locks in around scroll ~40%.

        const uniforms = this.particles.material.uniforms

        // Act 2 — dust assembles scatter -> diamond (uProgress drives the staggered
        // per-particle lerp in the vertex shader).
        tl.to(this.morph, {
            progress: 1,
            duration: 1.2,
            ease: 'power2.inOut',
            onUpdate: () => this.particles.setProgress(this.morph.progress)
        }, 0)

        // Burst as it forms: a brief outward pop of the whole cloud + a brightness flash.
        tl.fromTo(this.particles.points.scale,
            { x: 1, y: 1, z: 1 },
            { x: 1.18, y: 1.18, z: 1.18, duration: 0.3, ease: 'power2.out' }, 1.0)
        tl.to(this.particles.points.scale, { x: 1, y: 1, z: 1, duration: 0.5 }, 1.3)
        tl.to(uniforms.uOpacity, { value: 1, duration: 0.35 }, 0.95)
        tl.to(uniforms.uOpacity, { value: 0.8, duration: 0.6 }, 1.3)

        // Bloom flash at the same beat (desktop only — postProcessing is created after
        // World, so drive it through a proxy and apply lazily).
        const bloom = { strength: 0.38 }
        const applyBloom = () => {
            const pp = this.experience.postProcessing
            if (pp && pp.enabled) pp.bloomPass.strength = bloom.strength
        }
        tl.to(bloom, { strength: 0.75, duration: 0.3, ease: 'power2.out', onUpdate: applyBloom }, 1.0)
        tl.to(bloom, { strength: 0.38, duration: 0.5, onUpdate: applyBloom }, 1.3)

        // Act 3 — the assembled diamond leaves the stage: shrinks, drifts top-right,
        // dims to a faint constellation so late sections read on calm background.
        tl.to(this.particles.points.position, { x: 1.9, y: 0.7, duration: 0.9, ease: 'power1.inOut' }, 1.8)
        tl.to(this.particles.points.scale, { x: 0.55, y: 0.55, z: 0.55, duration: 0.9, ease: 'power1.inOut' }, 1.8)
        tl.to(uniforms.uOpacity, { value: 0.32, duration: 0.75 }, 1.95)

        // Gentle camera dolly OUT across the whole page (dolly-in cropped the diamond).
        tl.to(this.experience.camera.position, { z: 6.8, duration: 3 }, 0)
    }
}
