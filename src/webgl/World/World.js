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

        // Hero -> Services: droplet shrinks out, crystal scales in.
        tl.to(this.droplet.mesh.scale, { x: 0, y: 0, z: 0, duration: 1 }, 1)
        tl.call(() => {
            this.droplet.mesh.visible = false
            this.crystal.mesh.visible = true
        }, null, 1.5)
        tl.fromTo(this.crystal.mesh.scale,
            { x: 0, y: 0, z: 0 },
            { x: 1.5, y: 1.5, z: 1.5, duration: 1 }, 1.5)

        // Subtle camera dolly across the page.
        tl.to(this.experience.camera.position, { z: 4, duration: 4 }, 0)
    }
}
