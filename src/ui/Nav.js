// Burger menu + smooth in-page nav + active-section highlight.
export default class Nav {
    constructor() {
        this.burger = document.querySelector('[data-burger]')
        this.links = document.querySelector('[data-nav-links]')
        this.navLinks = Array.from(document.querySelectorAll('.nav__link[href^="#"]'))
        if (!this.burger || !this.links) return

        this.burger.addEventListener('click', () => this.toggle())
        this.links.addEventListener('click', (e) => {
            if (e.target.closest('a')) this.close()
        })

        this.setupActiveHighlight()
    }

    toggle() {
        this.links.classList.contains('is-open') ? this.close() : this.open()
    }

    open() {
        this.links.classList.add('is-open')
        this.burger.classList.add('is-open')
        this.burger.setAttribute('aria-expanded', 'true')
        this.burger.setAttribute('aria-label', 'Закрыть меню')
        document.body.style.overflow = 'hidden'
    }

    close() {
        this.links.classList.remove('is-open')
        this.burger.classList.remove('is-open')
        this.burger.setAttribute('aria-expanded', 'false')
        this.burger.setAttribute('aria-label', 'Открыть меню')
        document.body.style.overflow = ''
    }

    setupActiveHighlight() {
        const sections = this.navLinks
            .map((link) => {
                const href = link.getAttribute('href')
                // Skip bare "#" links (e.g. footer policy placeholder): querySelector('#') throws.
                return href && href.length > 1 ? document.querySelector(href) : null
            })
            .filter(Boolean)
        if (!sections.length || !('IntersectionObserver' in window)) return

        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue
                const id = `#${entry.target.id}`
                this.navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === id))
            }
        }, { rootMargin: '-50% 0px -50% 0px' })

        sections.forEach((s) => observer.observe(s))
    }
}
