// Decide whether to load the heavy WebGL scene or show the static poster.
// decideMode is pure (unit-tested); the wrappers below read the live environment.

export function decideMode({ reducedMotion, webgl }) {
    // Mobile no longer forces the poster — phones get the (responsively-sized) 3D too.
    // Poster stays only for genuine fallbacks: reduced-motion preference or no WebGL.
    if (reducedMotion || !webgl) return 'poster'
    return '3d'
}

export function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isMobile() {
    return window.matchMedia('(max-width: 768px), (pointer: coarse)').matches
}

export function hasWebGL() {
    try {
        const canvas = document.createElement('canvas')
        return !!(window.WebGLRenderingContext &&
            (canvas.getContext('webgl2') || canvas.getContext('webgl')))
    } catch (e) {
        return false
    }
}

export function shouldRender3D() {
    return decideMode({
        reducedMotion: prefersReducedMotion(),
        webgl: hasWebGL()
    }) === '3d'
}
