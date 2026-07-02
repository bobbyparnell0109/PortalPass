import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  // CI sets PORTALPASS_BASE=/PortalPass/ for GitHub Pages; local dev stays /
  base: process.env.PORTALPASS_BASE || '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
