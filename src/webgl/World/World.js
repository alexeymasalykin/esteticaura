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
        // Choreography: gold dust drifts in the hero; ~1/3 down the page it assembles into a
        // glittering diamond (particle constellation) with a burst flash. Fully reversible.
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1
            }
        })
        // Total timeline length ~3 (camera) → the diamond locks in around scroll ~40%.

        // Dust assembles scatter -> diamond (progress drives the per-particle lerp).
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
        tl.to(this.particles.material, { opacity: 1, duration: 0.35 }, 0.95)
        tl.to(this.particles.material, { opacity: 0.8, duration: 0.6 }, 1.3)

        // Gentle camera dolly across the whole page.
        tl.to(this.experience.camera.position, { z: 5, duration: 3 }, 0)
    }
}
