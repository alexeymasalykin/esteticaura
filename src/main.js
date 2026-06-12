import './style.css'
import Cursor from './ui/Cursor.js'
import Preloader from './ui/Preloader.js'
import Nav from './ui/Nav.js'
import BookingForm from './ui/BookingForm.js'
import BeforeAfter from './ui/BeforeAfter.js'
import Reveal from './ui/Reveal.js'
import HeroIntro from './ui/HeroIntro.js'
import ScrollProgress from './ui/ScrollProgress.js'
import { shouldRender3D } from './webgl/capabilities.js'

// UI is lightweight — always on.
new Cursor()
new Nav()
new BookingForm()
new BeforeAfter()
new Preloader()
new Reveal()
new HeroIntro()
new ScrollProgress()

if (shouldRender3D()) {
    // Load the heavy Three.js scene only AFTER the first paint, so the hero shows instantly
    // and Three.js sits in a lazy chunk off the critical path.
    const boot = () =>
        import('./webgl/Experience.js').then(({ default: Experience }) => {
            new Experience(document.querySelector('canvas.webgl'))
        })
    if ('requestIdleCallback' in window) {
        requestIdleCallback(boot, { timeout: 1500 })
    } else {
        window.setTimeout(boot, 200)
    }
} else {
    // Poster mode: no WebGL download. Show the static poster and release the preloader.
    document.body.classList.add('no-3d')
    window.dispatchEvent(new Event('experience-ready'))
}
