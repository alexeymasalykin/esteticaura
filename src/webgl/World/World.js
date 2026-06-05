import Environment from '../Environment.js'
import Particles from './Particles.js'
import Droplet from './Droplet.js'
import Crystal from './Crystal.js'
import gsap from 'gsap'

export default class World {
    constructor(experience) {
        this.experience = experience
        this.scene = this.experience.scene

        // Environment first — sets scene.environment used by PBR materials.
        this.environment = new Environment(this.experience)
        this.particles = new Particles(this.experience)
        this.droplet = new Droplet(this.experience)
        this.crystal = new Crystal(this.experience)

        this.setupScrollAnimations()
    }

    update(elapsedTime) {
        if (this.droplet) this.droplet.update(elapsedTime)
        if (this.crystal) this.crystal.update(elapsedTime)
        if (this.particles) this.particles.update(elapsedTime)
    }

    setupScrollAnimations() {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1
            }
        })

        // Hero -> Services: droplet shrinks out (its breathing auto-pauses at scale.x < 0.99).
        tl.to(this.droplet.mesh.scale, { x: 0, y: 0, z: 0, duration: 1 }, 1)

        // Particle flash across the transition (opacity is owned by the morph, not by update()).
        tl.to(this.particles.material, { opacity: 1, duration: 0.25 }, 1.25)
        tl.to(this.particles.material, { opacity: 0.6, duration: 0.5 }, 1.5)

        // Crystal assembles in from scale 0 (invisible) -> 1.0. Reversible on scroll-up.
        tl.fromTo(this.crystal.mesh.scale,
            { x: 0, y: 0, z: 0 },
            { x: 1.0, y: 1.0, z: 1.0, duration: 1 }, 1.5)

        // Subtle camera dolly across the page (gentle — keeps the gem from filling the screen).
        tl.to(this.experience.camera.position, { z: 5, duration: 4 }, 0)
    }
}
