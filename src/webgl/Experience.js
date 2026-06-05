import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import World from './World/World.js'
import PostProcessing from './PostProcessing.js'
import Debug from './Debug.js'

gsap.registerPlugin(ScrollTrigger)

export default class Experience {
    constructor(canvas) {
        window.experience = this
        this.canvas = canvas
        this.ready = false
        this.paused = false

        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: Math.min(window.devicePixelRatio, 2)
        }

        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color('#050505')
        this.scene.fog = new THREE.Fog('#050505', 10, 50)

        this.camera = new THREE.PerspectiveCamera(35, this.sizes.width / this.sizes.height, 0.1, 100)
        this.camera.position.set(0, 0, 6)
        this.scene.add(this.camera)

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        })
        this.renderer.setSize(this.sizes.width, this.sizes.height)
        this.renderer.setPixelRatio(this.sizes.pixelRatio)
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        this.renderer.toneMappingExposure = 0.39

        this.scrollY = window.scrollY
        this.cursor = { x: 0, y: 0 }

        window.addEventListener('resize', () => this.resize())
        window.addEventListener('mousemove', (e) => {
            this.cursor.x = e.clientX / this.sizes.width - 0.5
            this.cursor.y = e.clientY / this.sizes.height - 0.5
        })
        window.addEventListener('scroll', () => {
            this.scrollY = window.scrollY
        })

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.paused = true
            } else if (this.paused) {
                this.paused = false
                this.tick()
            }
        })

        // No external assets to load anymore — build the world synchronously.
        this.world = new World(this)

        this.postProcessing = new PostProcessing(this)
        this.debug = new Debug(this)

        this.ready = true
        window.dispatchEvent(new Event('experience-ready'))

        this.clock = new THREE.Clock()
        this.tick()
    }

    resize() {
        this.sizes.width = window.innerWidth
        this.sizes.height = window.innerHeight
        this.sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

        this.camera.aspect = this.sizes.width / this.sizes.height
        this.camera.updateProjectionMatrix()

        this.renderer.setSize(this.sizes.width, this.sizes.height)
        this.renderer.setPixelRatio(this.sizes.pixelRatio)

        if (this.postProcessing) this.postProcessing.resize()
    }

    tick() {
        if (this.paused) return
        const elapsedTime = this.clock.getElapsedTime()

        if (this.world) {
            this.world.update(elapsedTime)
        }

        const parallaxX = this.cursor.x * 0.5
        const parallaxY = -this.cursor.y * 0.5
        this.camera.position.x += (parallaxX - this.camera.position.x) * 0.05
        this.camera.position.y += (parallaxY - this.camera.position.y) * 0.05

        if (this.postProcessing && this.postProcessing.enabled) {
            this.postProcessing.render()
        } else {
            this.renderer.render(this.scene, this.camera)
        }
        window.requestAnimationFrame(() => this.tick())
    }
}
