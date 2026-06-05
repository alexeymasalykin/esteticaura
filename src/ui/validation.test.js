import { describe, it, expect } from 'vitest'
import {
    validateName,
    normalizePhone,
    validatePhone,
    buildBookingText,
    buildTelegramShareUrl,
} from './validation.js'

describe('validateName', () => {
    it('rejects too short / empty', () => {
        expect(validateName('')).toBe(false)
        expect(validateName(' a ')).toBe(false)
    })
    it('accepts cyrillic names with spaces and hyphen', () => {
        expect(validateName('Анна')).toBe(true)
        expect(validateName('Анна-Мария')).toBe(true)
        expect(validateName('Mary Jane')).toBe(true)
    })
    it('rejects names with digits', () => {
        expect(validateName('Анна2')).toBe(false)
    })
})

describe('normalizePhone', () => {
    it('strips non-digits', () => {
        expect(normalizePhone('+7 (999) 000-00-00')).toBe('79990000000')
    })
})

describe('validatePhone', () => {
    it('accepts 11-digit RU starting 7 or 8', () => {
        expect(validatePhone('+7 999 000 00 00')).toBe(true)
        expect(validatePhone('8 999 000 00 00')).toBe(true)
    })
    it('accepts bare 10-digit', () => {
        expect(validatePhone('9990000000')).toBe(true)
    })
    it('rejects too short', () => {
        expect(validatePhone('12345')).toBe(false)
    })
})

describe('buildBookingText', () => {
    it('composes a multiline ru message', () => {
        const txt = buildBookingText({ name: 'Анна', phone: '+7 999 000-00-00', service: 'Массаж' })
        expect(txt).toContain('Анна')
        expect(txt).toContain('+7 999 000-00-00')
        expect(txt).toContain('Массаж')
        expect(txt.split('\n').length).toBeGreaterThanOrEqual(4)
    })
})

describe('buildTelegramShareUrl', () => {
    it('url-encodes the text into a t.me/share link', () => {
        const url = buildTelegramShareUrl('Привет мир')
        expect(url.startsWith('https://t.me/share/url?')).toBe(true)
        expect(url).toContain(encodeURIComponent('Привет мир'))
    })
})
