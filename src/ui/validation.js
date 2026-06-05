// Pure, framework-free form logic. Unit-tested in validation.test.js.

// Telegram target — swap for the real studio handle/site before launch.
export const STUDIO_SITE_URL = 'https://esteticaura.love'

export function validateName(raw) {
    const value = String(raw ?? '').trim()
    // Letters (any language), spaces, apostrophe, hyphen; min 2 chars.
    return /^[\p{L}][\p{L}\s'-]{1,}$/u.test(value)
}

export function normalizePhone(raw) {
    return String(raw ?? '').replace(/\D/g, '')
}

export function validatePhone(raw) {
    const digits = normalizePhone(raw)
    if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) return true
    if (digits.length === 10) return true
    return false
}

export function buildBookingText({ name, phone, service }) {
    return [
        'Здравствуйте! Хочу записаться на приём.',
        `Имя: ${name}`,
        `Телефон: ${phone}`,
        `Услуга: ${service}`,
    ].join('\n')
}

export function buildTelegramShareUrl(text) {
    // Use encodeURIComponent (not URLSearchParams): spaces must be %20, matching the test.
    return `https://t.me/share/url?url=${encodeURIComponent(STUDIO_SITE_URL)}&text=${encodeURIComponent(text)}`
}
