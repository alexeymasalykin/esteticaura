// Pure point-sampling for the "diamond of dust": positions on a round brilliant-cut
// surface (faces + facet edges), plus per-particle attributes (color/scale/phase/delay).
// No three.js dependency — plain {x,y,z} math, consumed as Float32Array attributes.

const N = 16 // facet ring segments (16-fold brilliant)

// Design-system palette (sRGB hex → linear, as custom shaders skip color management).
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
const hexToLinear = (hex) => [
    srgbToLinear(((hex >> 16) & 0xff) / 255),
    srgbToLinear(((hex >> 8) & 0xff) / 255),
    srgbToLinear((hex & 0xff) / 255)
]
const GOLD = hexToLinear(0xF1D78A)
const CHAMPAGNE = hexToLinear(0xF7E7CE)
const WHITE = [1, 1, 1]

// Brilliant-cut wireframe: table + two crown rings + girdle + pavilion ring + culet,
// vertically centered so the assembled diamond sits symmetric around y=0.
function buildMesh(size) {
    const vertices = []
    const ring = (r, y) => {
        const start = vertices.length
        for (let i = 0; i < N; i++) {
            const a = (i / N) * Math.PI * 2
            vertices.push({ x: Math.cos(a) * r * size, y: y * size, z: Math.sin(a) * r * size })
        }
        return start
    }
    const yCenter = (0.42 - 0.95) / 2 // mid of [-0.95, 0.42] — shift up to center
    const tableC = vertices.length
    vertices.push({ x: 0, y: 0.42 * size, z: 0 })
    const T = ring(0.50, 0.42)
    const B = ring(0.80, 0.24)
    const G = ring(1.00, 0.00)
    const P = ring(0.55, -0.45)
    const culet = vertices.length
    vertices.push({ x: 0, y: -0.95 * size, z: 0 })
    for (const v of vertices) v.y -= yCenter * size

    const nx = (i) => (i + 1) % N
    const tris = []
    for (let i = 0; i < N; i++) tris.push([tableC, T + i, T + nx(i)])
    const band = (A, Bn) => {
        for (let i = 0; i < N; i++) {
            tris.push([A + i, Bn + i, Bn + nx(i)])
            tris.push([A + i, Bn + nx(i), A + nx(i)])
        }
    }
    band(T, B); band(B, G); band(G, P)
    for (let i = 0; i < N; i++) tris.push([P + i, culet, P + nx(i)])

    // Unique edges from the triangle soup (the visible facet wireframe).
    const seen = new Set()
    const edges = []
    for (const [a, b, c] of tris) {
        for (const [i, j] of [[a, b], [b, c], [c, a]]) {
            const key = i < j ? `${i}_${j}` : `${j}_${i}`
            if (seen.has(key)) continue
            seen.add(key)
            edges.push([vertices[i], vertices[j]])
        }
    }
    return { vertices, tris, edges }
}

const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })
const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x })
const len = (a) => Math.hypot(a.x, a.y, a.z)

// Cumulative distribution over weights → index sampler.
function makeSampler(weights) {
    const total = weights.reduce((s, w) => s + w, 0)
    const cum = []
    let acc = 0
    for (const w of weights) { acc += w; cum.push(acc / total) }
    return () => {
        const r = Math.random()
        let i = 0
        while (i < cum.length - 1 && r > cum[i]) i++
        return i
    }
}

function pickColor(table) {
    const r = Math.random()
    let acc = 0
    for (const [color, p] of table) {
        acc += p
        if (r < acc) return color
    }
    return table[table.length - 1][0]
}

export function buildDiamondPoints({ count, size, edgeRatio = 0.28 }) {
    const mesh = buildMesh(size)
    const targets = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const isEdge = new Uint8Array(count)
    const scales = new Float32Array(count)
    const phases = new Float32Array(count)
    const delays = new Float32Array(count)

    const edgeCount = Math.round(count * edgeRatio)
    const triArea = mesh.tris.map(([a, b, c]) =>
        len(cross(sub(mesh.vertices[b], mesh.vertices[a]), sub(mesh.vertices[c], mesh.vertices[a]))) * 0.5)
    const pickTri = makeSampler(triArea)
    const pickEdge = makeSampler(mesh.edges.map(([a, b]) => len(sub(b, a))))

    for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const edge = i < edgeCount
        isEdge[i] = edge ? 1 : 0

        if (edge) {
            // Uniform along a length-weighted facet edge — draws the cut's wireframe.
            const [a, b] = mesh.edges[pickEdge()]
            const t = Math.random()
            targets[i3] = a.x + (b.x - a.x) * t
            targets[i3 + 1] = a.y + (b.y - a.y) * t
            targets[i3 + 2] = a.z + (b.z - a.z) * t
        } else {
            // Area-weighted barycentric sample across a facet face.
            const [ia, ib, ic] = mesh.tris[pickTri()]
            const a = mesh.vertices[ia], b = mesh.vertices[ib], c = mesh.vertices[ic]
            let u = Math.random(), v = Math.random()
            if (u + v > 1) { u = 1 - u; v = 1 - v }
            targets[i3] = a.x + (b.x - a.x) * u + (c.x - a.x) * v
            targets[i3 + 1] = a.y + (b.y - a.y) * u + (c.y - a.y) * v
            targets[i3 + 2] = a.z + (b.z - a.z) * u + (c.z - a.z) * v
        }

        // Edges read brighter: larger sparks, lighter palette; faces stay dim gold dust.
        scales[i] = edge ? 0.9 + Math.random() * 0.6 : 0.55 + Math.random() * 0.5
        const color = edge
            ? pickColor([[CHAMPAGNE, 0.75], [WHITE, 0.25]])
            : pickColor([[GOLD, 0.80], [CHAMPAGNE, 0.15], [WHITE, 0.05]])
        colors[i3] = color[0]; colors[i3 + 1] = color[1]; colors[i3 + 2] = color[2]

        phases[i] = Math.random()
        delays[i] = Math.random() * 0.65 // arrival window: all assembled by progress 1
    }

    return { targets, colors, isEdge, scales, phases, delays, mesh }
}

export function buildScatter({ count, spread }) {
    const a = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) a[i] = (Math.random() - 0.5) * spread
    return a
}
