import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// VITE_BASE_PATH is set in CI to /<repo-name>/ for GitHub Pages deployments.
// Locally it falls back to '/' so dev server still works normally.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
})
