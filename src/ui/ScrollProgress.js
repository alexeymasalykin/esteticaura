// Thin gold progress line under the nav — supports the scroll narrative
// (dust -> diamond) without competing with it. Transform-only, rAF-throttled.

export function progressFraction(scrollY, maxScroll) {
    if (maxScroll <= 0) return 0
    return Math.min(1, Math.max(0, scrollY / maxScroll))
}

export default class ScrollProgress {
    constructor() {
        this.bar = document.createElement('div')
        this.bar.className = 'scroll-progress'
        this.bar.setAttribute('aria-hidden', 'true')
        document.body.appendChild(this.bar)

        this.queued = false
        const onScroll = () => {
            if (this.queued) return
            this.queued = true
            requestAnimationFrame(() => {
                this.queued = false
                const max = document.documentElement.scrollHeight - window.innerHeight
                this.bar.style.transform = `scaleX(${progressFraction(window.scrollY, max)})`
            })
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        onScroll()
    }
}
