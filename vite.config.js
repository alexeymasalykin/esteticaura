import { defineConfig } from 'vite'

// BASE_PATH is set by the GitHub Pages workflow (/esteticaura/); local dev/build
// stays at the root.
export default defineConfig({
    base: process.env.BASE_PATH || '/'
})
