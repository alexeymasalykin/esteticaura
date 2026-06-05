// Pure geometry helpers for the before/after slider. Unit-tested in slider.test.js.

export function clampPercent(value) {
    return Math.min(100, Math.max(0, value))
}

export function positionFromPointer(clientX, rect) {
    const raw = ((clientX - rect.left) / rect.width) * 100
    return clampPercent(raw)
}
