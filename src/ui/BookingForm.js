import {
    validateName,
    validatePhone,
    buildBookingText,
    buildTelegramShareUrl,
} from './validation.js'

// Wires the booking <form data-booking> to pure validators + telegram submit.
// Validation runs on blur; errors announced via aria-live spans.
export default class BookingForm {
    constructor() {
        this.form = document.querySelector('[data-booking]')
        if (!this.form) return

        this.fields = {
            name: { input: this.form.querySelector('#name'), error: this.form.querySelector('#name-error'), validate: validateName, message: 'Введите имя (минимум 2 буквы).' },
            phone: { input: this.form.querySelector('#phone'), error: this.form.querySelector('#phone-error'), validate: validatePhone, message: 'Введите корректный номер телефона.' },
            service: { input: this.form.querySelector('#service'), error: this.form.querySelector('#service-error'), validate: (v) => v.trim() !== '', message: 'Выберите услугу.' },
        }
        this.submitBtn = this.form.querySelector('[data-submit]')
        this.status = this.form.querySelector('[data-status]')

        this.bindBlur()
        this.form.addEventListener('submit', (e) => this.onSubmit(e))
    }

    bindBlur() {
        for (const field of Object.values(this.fields)) {
            field.input.addEventListener('blur', () => this.checkField(field))
        }
    }

    checkField(field) {
        const ok = field.validate(field.input.value)
        field.input.setAttribute('aria-invalid', ok ? 'false' : 'true')
        field.error.textContent = ok ? '' : field.message
        return ok
    }

    onSubmit(e) {
        e.preventDefault()
        this.setStatus('', '')

        const results = Object.values(this.fields).map((f) => this.checkField(f))
        if (results.includes(false)) {
            this.setStatus('Проверьте поля формы.', 'is-error')
            return
        }

        this.setSubmitting(true)
        try {
            const data = {
                name: this.fields.name.input.value.trim(),
                phone: this.fields.phone.input.value.trim(),
                service: this.fields.service.input.value,
            }
            const url = buildTelegramShareUrl(buildBookingText(data))
            window.open(url, '_blank', 'noopener')
            this.setStatus('Заявка готова — отправьте её в открывшемся Telegram.', 'is-success')
            this.form.reset()
        } catch (err) {
            this.setStatus('Не удалось открыть Telegram. Напишите нам напрямую.', 'is-error')
        } finally {
            this.setSubmitting(false)
        }
    }

    setSubmitting(on) {
        this.submitBtn.disabled = on
        this.submitBtn.innerHTML = on
            ? 'Отправка<span class="spinner"></span>'
            : 'Отправить заявку'
    }

    setStatus(text, cls) {
        this.status.textContent = text
        this.status.className = `form__status ${cls}`.trim()
    }
}
