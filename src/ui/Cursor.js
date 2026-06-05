import gsap from 'gsap'

export default class Cursor {
    constructor() {
        // Desktop-only: тач-устройства не имеют курсора (фикс «висящего» курсора в углу).
        this.enabled = window.matchMedia('(hover: hover) and (pointer: fine)').matches
        if (!this.enabled) return

        this.cursor = document.createElement('div')
        this.cursor.classList.add('custom-cursor')
        document.body.appendChild(this.cursor)

        this.cursorFollower = document.createElement('div')
        this.cursorFollower.classList.add('custom-cursor-follower')
        document.body.appendChild(this.cursorFollower)

        this.addStyles()
        this.initEvents()
    }

    addStyles() {
        const style = document.createElement('style')
        style.innerHTML = `
            .custom-cursor {
                position: fixed;
                top: 0;
                left: 0;
                width: 10px;
                height: 10px;
                background: #D4AF37;
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                transform: translate(-50%, -50%);
                mix-blend-mode: difference;
            }
            .custom-cursor-follower {
                position: fixed;
                top: 0;
                left: 0;
                width: 40px;
                height: 40px;
                border: 1px solid #D4AF37;
                border-radius: 50%;
                pointer-events: none;
                z-index: 9998;
                transform: translate(-50%, -50%);
                transition: transform 0.1s ease;
                mix-blend-mode: difference;
            }
        `
        document.head.appendChild(style)
    }

    initEvents() {
        document.addEventListener('mousemove', (e) => {
            gsap.to(this.cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0
            })
            gsap.to(this.cursorFollower, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.1
            })
        })

        document.addEventListener('mousedown', () => {
            gsap.to(this.cursor, { scale: 0.5, duration: 0.1 })
            gsap.to(this.cursorFollower, { scale: 0.5, duration: 0.1 })
        })

        document.addEventListener('mouseup', () => {
            gsap.to(this.cursor, { scale: 1, duration: 0.1 })
            gsap.to(this.cursorFollower, { scale: 1, duration: 0.1 })
        })
    }
}
