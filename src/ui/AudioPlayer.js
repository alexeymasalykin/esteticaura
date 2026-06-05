export default class AudioPlayer {
    constructor() {
        this.container = document.createElement('div')
        this.container.classList.add('audio-player')
        this.container.innerHTML = 'SOUND OFF'
        document.body.appendChild(this.container)

        this.audio = new Audio('/music.mp3') // Placeholder
        this.audio.loop = true
        this.isPlaying = false

        this.addStyles()
        this.initEvents()
    }

    addStyles() {
        const style = document.createElement('style')
        style.innerHTML = `
            .audio-player {
                position: fixed;
                bottom: 30px;
                right: 30px;
                color: #D4AF37;
                font-family: 'Inter', sans-serif;
                font-size: 0.8rem;
                letter-spacing: 0.2em;
                cursor: pointer;
                z-index: 100;
                mix-blend-mode: difference;
                opacity: 0.7;
                transition: opacity 0.3s;
            }
            .audio-player:hover {
                opacity: 1;
            }
        `
        document.head.appendChild(style)
    }

    initEvents() {
        this.container.addEventListener('click', () => {
            if (this.isPlaying) {
                this.audio.pause()
                this.container.innerHTML = 'SOUND OFF'
            } else {
                this.audio.play().catch(() => {
                    alert('Please add a music.mp3 file to the public folder!')
                })
                this.container.innerHTML = 'SOUND ON'
            }
            this.isPlaying = !this.isPlaying
        })
    }
}
