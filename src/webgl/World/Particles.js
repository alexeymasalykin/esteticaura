import * as THREE from 'three'
import { isMobile } from '../capabilities.js'
import { buildDiamondPoints, buildScatter } from './diamondPoints.js'

// Gold dust that doubles as the hero object. Each particle has two homes: a scattered
// ambient position (hero dust field) and a target point on a round brilliant-cut diamond
// (faces + a brighter facet-edge wireframe). The whole morph lives in the vertex shader:
// scroll drives a single uProgress uniform, each particle departs at its own aDelay
// (staggered swarm), twinkles with its own aPhase and carries its own palette color.
export default class Particles {
    constructor(experience) {
        this.experience = experience
        this.scene = experience.scene
        // Lighter particle budget on phones (fits the smaller diamond + saves the GPU).
        this.count = isMobile() ? 3800 : 6300
        // Diamond sized + vertically centered to fit the viewport whole at assembly time.
        this.diamondSize = 1.8

        // Comet trail: dust gathers behind the cursor. Mouse-only — on touch the
        // cursor never moves and the dust would clump dead-center.
        this.cometEnabled = window.matchMedia('(pointer: fine)').matches
        this.cometStrength = 1
        this.cometHead = new THREE.Vector2()
        this.cometTail = new THREE.Vector2()
        this.cometTarget = new THREE.Vector2()
        this.lastTime = 0

        this.setGeometry()
        this.setMaterial()
        this.setPoints()
    }

    setGeometry() {
        const built = buildDiamondPoints({ count: this.count, size: this.diamondSize })
        this.geometry = new THREE.BufferGeometry()
        this.geometry.setAttribute('position', new THREE.BufferAttribute(buildScatter({ count: this.count, spread: 26 }), 3))
        this.geometry.setAttribute('aTarget', new THREE.BufferAttribute(built.targets, 3))
        this.geometry.setAttribute('aColor', new THREE.BufferAttribute(built.colors, 3))
        this.geometry.setAttribute('aScale', new THREE.BufferAttribute(built.scales, 1))
        this.geometry.setAttribute('aPhase', new THREE.BufferAttribute(built.phases, 1))
        this.geometry.setAttribute('aDelay', new THREE.BufferAttribute(built.delays, 1))
    }

    setMaterial() {
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uProgress: { value: 0 },
                uTime: { value: 0 },
                uSize: { value: 0.16 },
                uFit: { value: 1 },
                uScaleH: { value: 450 },
                uBoost: { value: 1 },
                uBreath: { value: 1 },
                uOpacity: { value: 0.7 },
                uTint: { value: new THREE.Color('#ffffff') },
                uPointer: { value: new THREE.Vector2() },
                uTrail: { value: new THREE.Vector2() },
                uComet: { value: 0 }
            },
            vertexShader: /* glsl */ `
                attribute vec3 aTarget;
                attribute vec3 aColor;
                attribute float aScale;
                attribute float aPhase;
                attribute float aDelay;

                uniform float uProgress;
                uniform float uTime;
                uniform float uSize;
                uniform float uFit;
                uniform float uScaleH;
                uniform float uBoost;
                uniform float uBreath;
                uniform vec2 uPointer;
                uniform vec2 uTrail;
                uniform float uComet;

                varying vec3 vColor;
                varying float vFog;
                varying float vGlow;

                void main() {
                    // Staggered assembly: each particle departs at its own delay; the
                    // smoothstep window doubles as per-particle easing. All home by 1.0.
                    float p = smoothstep(aDelay, aDelay + 0.35, uProgress);
                    // uBreath: slow ±1.5% pulse of the assembled diamond only (scatter
                    // and the GSAP-driven object scale stay untouched).
                    vec3 pos = mix(position, aTarget * uFit * uBreath, p);

                    // Ambient drift for the hero dust, fading out so facets stay crisp.
                    pos += vec3(
                        sin(uTime * 0.32 + aPhase * 6.2832),
                        cos(uTime * 0.27 + aPhase * 12.566),
                        sin(uTime * 0.21 + aPhase * 9.4248)
                    ) * 0.35 * (1.0 - p);

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

                    // Comet trail: dust on screen near the cursor is pulled toward the
                    // cursor RAY (view space, per-depth ray point — so every depth layer
                    // lines up under the cursor on screen). The segment head (cursor) ->
                    // tail (laggy smoothed cursor) stretches the clump on movement.
                    // Dust state only: the pull dies with morph progress.
                    vGlow = 0.0;
                    if (uComet > 0.0) {
                        float depth = -mvPosition.z;
                        vec2 ba = (uPointer - uTrail) * depth;
                        vec2 pa = mvPosition.xy - uTrail * depth;
                        float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
                        vec2 toAxis = (uTrail * depth + ba * h) - mvPosition.xy;
                        float pull = smoothstep(0.24 * depth, 0.0, length(toAxis)) // ~constant screen radius
                            * (0.6 + 0.4 * h)              // head denser than tail
                            * smoothstep(1.5, 3.0, depth)  // skip dust right at the lens
                            * (0.75 + 0.25 * aPhase)       // loose grouping, not a hard snap
                            * uComet * (1.0 - p);
                        mvPosition.xy += toAxis * min(pull * 1.1, 0.85);
                        vGlow = pull;
                    }

                    gl_Position = projectionMatrix * mvPosition;

                    // Per-particle twinkle (own speed + phase) replaces the old global pulse.
                    float twinkle = 0.72 + 0.28 * sin(uTime * (1.6 + aPhase * 1.2) + aPhase * 6.2832);
                    // Narrow screens shrink the diamond (uFit) — shrink sparks with it,
                    // partially, so the small diamond keeps a fine grain instead of chunky dots.
                    // uBoost (assembled state only) equalizes spark density with the mobile
                    // look on wide screens: overlapping additive sparks burn into white glints.
                    gl_PointSize = uSize * aScale * twinkle * (0.7 + 0.3 * uFit) * mix(1.0, uBoost, p)
                        * (1.0 + vGlow * 0.8) * (uScaleH / -mvPosition.z);

                    vColor = aColor;
                    // Matches the scene fog (#050505, 10..50) the old PointsMaterial used.
                    vFog = smoothstep(10.0, 50.0, -mvPosition.z);
                }
            `,
            fragmentShader: /* glsl */ `
                uniform float uOpacity;
                uniform vec3 uTint;

                varying vec3 vColor;
                varying float vFog;
                varying float vGlow;

                void main() {
                    // Procedural soft round sprite (bright core, feathered halo).
                    float d = distance(gl_PointCoord, vec2(0.5));
                    float alpha = smoothstep(0.5, 0.08, d);
                    alpha *= alpha;
                    // Comet-gathered sparks burn brighter.
                    gl_FragColor = vec4(vColor * uTint * (1.0 + vGlow * 1.5) * (1.0 - vFog), alpha * uOpacity);
                    #include <tonemapping_fragment>
                    #include <colorspace_fragment>
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    }

    setPoints() {
        this.points = new THREE.Points(this.geometry, this.material)
        // Scatter spans ±13 while the camera sits at z≈6 — keep the cloud unculled.
        this.points.frustumCulled = false
        this.scene.add(this.points)
    }

    // Driven by the scroll timeline (0 = scattered dust, 1 = assembled diamond).
    setProgress(p) {
        this.material.uniforms.uProgress.value = p
    }

    update(elapsedTime) {
        const { width, height, pixelRatio } = this.experience.sizes
        // Responsive fit: shrink the diamond target on narrow / portrait aspects
        // (the ambient scatter field is left full-bleed).
        const fit = Math.min(1, Math.max(0.42, (width / height) / 1.15))
        this.material.uniforms.uFit.value = fit
        // Wide screens spread the same particle budget over a bigger diamond — boost
        // assembled spark size so the per-area glitter density matches the phone look.
        this.material.uniforms.uBoost.value = 1 + ((fit - 0.42) / 0.58) * 0.5
        // Point size attenuation works in device pixels.
        this.material.uniforms.uScaleH.value = height * 0.5 * pixelRatio
        this.material.uniforms.uTime.value = elapsedTime

        this.updateComet(elapsedTime)

        // Slow rotation: ambient drift in the hero, shows the assembled diamond in 3D.
        this.points.rotation.y = elapsedTime * 0.06

        // Assembled-state life: breathing pulse (~4s), slow axis precession, and a
        // light tilt toward the cursor — the diamond follows the viewer like a piece
        // on a counter. All weighted by morph progress so the dust stays untouched.
        const progress = this.material.uniforms.uProgress.value
        this.material.uniforms.uBreath.value = 1 + 0.015 * Math.sin(elapsedTime * 1.6) * progress
        const { cursor } = this.experience
        const tiltX = (cursor.y * 0.12 + Math.sin(elapsedTime * 0.21) * 0.025) * progress
        const tiltZ = (-cursor.x * 0.08 + Math.cos(elapsedTime * 0.17) * 0.02) * progress
        this.points.rotation.x += (tiltX - this.points.rotation.x) * 0.04
        this.points.rotation.z += (tiltZ - this.points.rotation.z) * 0.04
    }

    // Smoothed cursor head + lagging tail as view-space ray tangents (xy per unit
    // depth). The lag between the two stretches the gathered dust into a comet trail.
    updateComet(elapsedTime) {
        if (!this.cometEnabled) return
        const dt = Math.min(elapsedTime - this.lastTime, 0.1)
        this.lastTime = elapsedTime

        const { camera, cursor } = this.experience
        const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
        this.cometTarget.set(
            cursor.x * 2 * tanHalf * camera.aspect,
            -cursor.y * 2 * tanHalf
        )
        // Frame-rate independent smoothing: fast head, lazy tail — the gap between
        // them is the comet's length, so the trail lingers ~a second after movement.
        this.cometHead.lerp(this.cometTarget, 1 - Math.exp(-8 * dt))
        this.cometTail.lerp(this.cometTarget, 1 - Math.exp(-1.1 * dt))

        this.material.uniforms.uPointer.value.copy(this.cometHead)
        this.material.uniforms.uTrail.value.copy(this.cometTail)
        this.material.uniforms.uComet.value = this.cometStrength
    }
}
