// Adaptive resolution: when the average frame stays above SLOW_FRAME_MS (≈45fps),
// step the pixel ratio down one notch. Pure decision logic — the render loop owns
// the sampling and applies the result.

const STEPS = [2, 1.5, 1.25, 1]
export const SLOW_FRAME_MS = 22

export function nextPixelRatio(current, avgFrameMs) {
    if (avgFrameMs <= SLOW_FRAME_MS) return null
    return STEPS.find((s) => s < current - 1e-3) ?? null
}
