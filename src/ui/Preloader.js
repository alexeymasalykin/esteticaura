import gsap from 'gsap'

export default class Preloader {
    constructor() {
        this.overlay = document.createElement('div')
        this.overlay.classList.add('preloader')
        this.overlay.innerHTML = `
            <div class="preloader-content">
                <div class="preloader-logo">ESTETICAURA</div>
                <div class="preloader-bar-container">
                    <div class="preloader-bar"></div>
                </div>
            </div>
        `
        document.body.appendChild(this.overlay)

        // The 3D scene now loads asynchronously (or not at all). Hide on the ready signal;
        // in poster mode main.js dispatches 'experience-ready' itself.
        window.addEventListener('experience-ready', () => this.hide(), { once: true })

        // Safety fallback in case the ready signal never fires.
        setTimeout(() => {
            if (document.querySelector('.preloader')) {
                this.hide()
            }
        }, 4000)
    }

    hide() {
        gsap.to('.preloader', {
            opacity: 0,
            duration: 1,
            delay: 0.5,
            onComplete: () => {
                this.overlay.remove()
            }
        })
    }
}
