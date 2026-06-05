import * as THREE from 'three'
import Emblem from './Emblem.js'
import Particles from './Particles.js'
import Lights from './Lights.js'
import MorphShapes from './MorphShapes.js'
import gsap from 'gsap'

export default class World {
    constructor(experience) {
        this.experience = experience
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        // Setup
        this.lights = new Lights(this.experience)
        this.emblem = new Emblem(this.experience)
        this.particles = new Particles(this.experience)
        this.morphShapes = new MorphShapes(this.experience)

        // Debug Cube (Red) - To verify 3D rendering
        this.debugCube = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshBasicMaterial({ color: 'red', wireframe: true })
        )
        this.debugCube.position.set(2, 0, 0)
        this.scene.add(this.debugCube)

        this.setupScrollAnimations()
    }

    update(elapsedTime, deltaTime) {
        if (this.emblem) this.emblem.update(elapsedTime)
        if (this.particles) this.particles.update(elapsedTime)
        if (this.morphShapes) this.morphShapes.update(elapsedTime)

        if (this.debugCube) {
            this.debugCube.rotation.x = elapsedTime
            this.debugCube.rotation.y = elapsedTime
        }
    }

    setupScrollAnimations() {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: "body",
                start: "top top",
                end: "bottom bottom",
                scrub: 1
            }
        })

        // Hero -> About (Emblem fades out, Drop fades in)
        tl.to(this.emblem.mesh.material, { opacity: 0, duration: 1 }, 0)
        tl.to(this.emblem.mesh.scale, { x: 0, y: 0, duration: 1 }, 0)

        tl.call(() => { this.morphShapes.drop.visible = true }, null, 0.5)
        tl.fromTo(this.morphShapes.drop.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, duration: 1 }, 0.5)

        // About -> Services (Drop -> Crystal)
        tl.to(this.morphShapes.drop.scale, { x: 0, y: 0, z: 0, duration: 1 }, 2)
        tl.call(() => { this.morphShapes.drop.visible = false; this.morphShapes.crystal.visible = true }, null, 2.5)
        tl.fromTo(this.morphShapes.crystal.scale, { x: 0, y: 0, z: 0 }, { x: 1.5, y: 1.5, z: 1.5, duration: 1 }, 2.5)

        // Move Camera slightly
        tl.to(this.experience.camera.position, { z: 4, duration: 4 }, 0)
    }
}
