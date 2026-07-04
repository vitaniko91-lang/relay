import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so hashed assets resolve from any subpath — a GitHub Pages
  // project path (https://<user>.github.io/relay/) or a Vercel root. The app
  // uses only a hash router (#/runs, #/runs/:id), so relative asset URLs are safe.
  base: './',
  plugins: [react()],
})
