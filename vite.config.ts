/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'react-redux', '@reduxjs/toolkit', 'axios'],
          ui: ['lucide-react', 'framer-motion', 'react-hot-toast', 'clsx', 'tailwind-merge', 'date-fns', 'react-hook-form'],
          map: ['react-leaflet', 'leaflet'],
          charts: ['recharts']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    },
    include: ['src/**/*.test.{ts,tsx}'],
    alias: {
      '@': '/src'
    }
  }
})
