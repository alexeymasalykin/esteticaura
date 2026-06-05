// Visual tuning panel. Active only when the URL ends with #debug.
// lil-gui is dynamically imported so it stays out of the default bundle path.
export default class Debug {
    constructor(experience) {
        this.experience = experience
        this.active = window.location.hash === '#debug'
        if (!this.active) return

        import('lil-gui').then(({ default: GUI }) => this.build(GUI))
    }

    build(GUI) {
        const gui = new GUI({ title: 'ESTETICAURA — 3D' })
        const { renderer, postProcessing, world } = this.experience

        const rf = gui.addFolder('Renderer')
        rf.add(renderer, 'toneMappingExposure', 0, 3, 0.01)

        if (postProcessing && postProcessing.enabled) {
            const bf = gui.addFolder('Bloom')
            bf.add(postProcessing.bloomPass, 'strength', 0, 2, 0.01)
            bf.add(postProcessing.bloomPass, 'radius', 0, 2, 0.01)
            bf.add(postProcessing.bloomPass, 'threshold', 0, 1, 0.01)
        }

        const df = gui.addFolder('Droplet')
        df.add(world.droplet.material, 'roughness', 0, 0.3, 0.005)
        df.add(world.droplet.material, 'transmission', 0, 1, 0.01)
        df.add(world.droplet.material, 'ior', 1, 2.333, 0.01)
        df.add(world.droplet.material, 'iridescence', 0, 1, 0.01)

        const cf = gui.addFolder('Crystal')
        cf.add(world.crystal.material, 'roughness', 0, 0.5, 0.005)
        cf.add(world.crystal.material, 'metalness', 0, 1, 0.01)
        cf.add(world.crystal.material, 'envMapIntensity', 0, 3, 0.05)
    }
}
