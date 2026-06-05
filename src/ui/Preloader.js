import gsap from 'gsap'

export default class Preloader {
    constructor(experience) {
        this.experience = experience

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

        this.addStyles()

        // World is built synchronously — experience may already be ready.
        if (this.experience.ready) {
            this.hide()
        } else {
            window.addEventListener('experience-ready', () => this.hide(), { once: true })
        }

        // Safety fallback in case the ready signal never fires.
        setTimeout(() => {
            if (document.querySelector('.preloader')) {
                this.hide()
            }
        }, 4000)
    }


    addStyles() {
        const style = document.createElement('style')
        style.innerHTML = `
            .preloader {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #050505;
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
                color: #D4AF37;
            }
            .preloader-logo {
                font-family: 'Playfair Display', serif;
                font-size: 2rem;
                margin-bottom: 20px;
                opacity: 0;
                animation: fadeIn 1s forwards;
            }
            .preloader-bar-container {
                width: 200px;
                height: 2px;
                background: rgba(212, 175, 55, 0.2);
                position: relative;
                overflow: hidden;
            }
            .preloader-bar {
                width: 0%;
                height: 100%;
                background: #D4AF37;
                transition: width 0.5s ease;
                animation: load 2s infinite;
            }
            @keyframes fadeIn {
                to { opacity: 1; }
            }
            @keyframes load {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `
        document.head.appendChild(style)
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
