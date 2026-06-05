import * as THREE from 'three'

export default class Resources {
    constructor(sources) {
        this.sources = sources
        this.items = {}
        this.toLoad = this.sources.length
        this.loaded = 0
        this.callbacks = {}

        this.setLoaders()
        this.startLoading()
    }

    setLoaders() {
        this.loaders = {}
        this.loaders.textureLoader = new THREE.TextureLoader()
    }

    startLoading() {
        if (this.toLoad === 0) {
            this.trigger('ready')
            return
        }

        for (const source of this.sources) {
            if (source.type === 'texture') {
                this.loaders.textureLoader.load(
                    source.path,
                    (file) => {
                        this.sourceLoaded(source, file)
                    },
                    null,
                    (error) => {
                        console.error('Error loading ' + source.path, error)
                        // Still mark as loaded so we don't hang
                        this.sourceLoaded(source, null)
                    }
                )
            }
        }
    }

    sourceLoaded(source, file) {
        this.items[source.name] = file
        this.loaded++

        if (this.loaded === this.toLoad) {
            this.trigger('ready')
        }
    }

    on(name, callback) {
        this.callbacks[name] = callback
    }

    trigger(name) {
        if (this.callbacks[name]) {
            this.callbacks[name]()
        }
    }
}
