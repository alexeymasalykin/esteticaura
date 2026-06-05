import Environment from '../Environment.js'
import Particles from './Particles.js'
import Crystal from './Crystal.js'
import gsap from 'gsap'

export default class World {
    constructor(experience) {
        this.experience = experience
        this.scene = this.experience.scene

        // Environment first — sets scene.environment used by PBR materials.
        this.environment = new Environment(this.experience)
        this.particles = new Particles(this.experience)
        this.crystal = new Crystal(this.experience)

        this.setupScrollAnimations()
    }

    update(elapsedTime) {
        if (this.crystal) this.crystal.update(elapsedTime)
        if (this.particles) this.particles.update(elapsedTime)
    }

    setupScrollAnimations() {
        // Choreography: gold dust drifts in the hero; ~1/3 down the page it gathers to the
        // centre, bursts in a flash, and the diamond springs into being. Fully reversible.
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1
            }
        })
        // Total timeline length ~3 → the burst lands around scroll progress 1/3 (position 1).

        // 0 -> 1: gold dust contracts toward the centre ("gathering"), denser & brighter.
        tl.to(this.particles.points.scale, { x: 0.12, y: 0.12, z: 0.12, duration: 1, ease: 'power2.in' }, 0)
        tl.to(this.particles.material, { opacity: 1, duration: 1 }, 0)

        // ~1: BURST — dust pops outward + a brightness flash; the diamond springs in from 0.
        tl.to(this.particles.points.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 0.35, ease: 'power3.out' }, 1)
        tl.fromTo(this.crystal.mesh.scale,
            { x: 0, y: 0, z: 0 },
            { x: 1.0, y: 1.0, z: 1.0, duration: 0.6, ease: 'back.out(1.7)' }, 1)
        tl.to(this.particles.material, { opacity: 0.5, duration: 0.8 }, 1.1)

        // Settle: dust returns to a calm ambient field around the gem.
        tl.to(this.particles.points.scale, { x: 1, y: 1, z: 1, duration: 1 }, 1.35)

        // Gentle camera dolly across the whole page.
        tl.to(this.experience.camera.position, { z: 5, duration: 3 }, 0)
    }
}
