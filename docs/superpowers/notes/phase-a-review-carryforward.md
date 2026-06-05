# Phase A — review carry-forward notes

Findings from the Task 3 code-quality review (commit `900d626`) that were intentionally
deferred (not bugs to fix inside Phase A's verbatim-plan code). Address in the noted phase.

## For Phase C (3D upgrade / morph choreography)
- **Droplet breathing vs. scroll-out tween conflict.** `Droplet.update()` writes
  `mesh.scale.y` every visible frame (the hero "breathing" the spec requires). During the
  scroll morph (World.js timeline pos 1.0→1.5) a GSAP tween also drives `droplet.mesh.scale.y → 0`,
  so the two fight for one frame each tick → possible subtle y-axis stutter during the
  hero→crystal transition. Fix in Phase C's proper crossfade: gate the breathing with a
  "morphing" flag (or hand scale control entirely to the crossfade) so `update()` stops
  touching `scale.y` once the morph starts. Do NOT just delete the breathing — it's a
  required hero effect.

## For Phase D (performance / dynamic import / a11y)
- **Preloader `else` event branch goes live here.** `Preloader` currently subscribes to
  `experience-ready` in an `else` branch that never fires today, because `Experience` builds
  synchronously and `ready` is already `true` before `Preloader` is constructed (the `if`
  branch handles it). When Three.js moves to dynamic import in Phase D, `Experience` init
  becomes async and the event path becomes the live one — keep the pair intact. It is
  intentional defensive code, not dead weight.
