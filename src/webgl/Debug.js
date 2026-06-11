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

        const pf = gui.addFolder('Dust')
        const uniforms = world.particles.material.uniforms
        pf.add(uniforms.uOpacity, 'value', 0, 1, 0.01).name('opacity')
        pf.add(uniforms.uSize, 'value', 0.05, 0.4, 0.005).name('size')
        pf.addColor({ tint: '#' + uniforms.uTint.value.getHexString() }, 'tint')
            .onChange((v) => uniforms.uTint.value.set(v))
        pf.add(world.particles, 'cometStrength', 0, 1.5, 0.05).name('comet')
    }
}
