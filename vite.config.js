import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Produce smaller, cache-friendly chunks
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('firebase/auth') || (id.includes('node_modules/firebase') && !id.includes('firestore') && !id.includes('messaging'))) {
            return 'firebase-core'
          }
          if (id.includes('firebase/firestore') || id.includes('node_modules/@firebase/firestore')) {
            return 'firebase-db'
          }
          if (id.includes('firebase/messaging') || id.includes('node_modules/@firebase/messaging')) {
            return 'firebase-msg'
          }
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/@radix-ui')) {
            return 'ui-vendor'
          }
          if (id.includes('node_modules/@tanstack') || id.includes('node_modules/axios') || id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'data-vendor'
          }
        },
      },
    },
    // Warn on chunks > 600 kB (default 500 kB)
    chunkSizeWarningLimit: 600,
    // Minify with esbuild (default, fast)
    minify: 'esbuild',
    // Generate source maps for Sentry/debugging (remove if not needed)
    sourcemap: false,
    // Ensure CSS is code-split per chunk
    cssCodeSplit: true,
  },
})
