import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SportNet – Cotizador & CRM',
        short_name: 'SportNet',
        description: 'Cotizador inteligente y CRM para mallas deportivas',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0ea5e9',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
