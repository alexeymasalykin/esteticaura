import { positionFromPointer } from './slider.js'

// Interactive before/after comparison. Each [data-ba] holds a base img, a
// [data-ba-after] overlay (clip-path), and a [data-ba-handle] divider.
export default class BeforeAfter {
    constructor() {
        this.instances = Array.from(document.querySelectorAll('[data-ba]'))
        this.instances.forEach((el) => this.bind(el))
    }

    bind(root) {
        const after = root.querySelector('[data-ba-after]')
        const handle = root.querySelector('[data-ba-handle]')
        if (!after || !handle) return

        const setPos = (clientX) => {
            const pct = positionFromPointer(clientX, root.getBoundingClientRect())
            after.style.clipPath = `inset(0 0 0 ${pct}%)`
            handle.style.left = `${pct}%`
        }

        let dragging = false
        const start = (e) => { dragging = true; setPos(e.clientX); root.setPointerCapture?.(e.pointerId) }
        const move = (e) => { if (dragging) setPos(e.clientX) }
        const end = () => { dragging = false }

        root.addEventListener('pointerdown', start)
        root.addEventListener('pointermove', move)
        window.addEventListener('pointerup', end)
    }
}
