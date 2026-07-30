import { writeFileSync } from 'fs';
import { join } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const buildId = String(Date.now());

// Her build'de dist/version.txt'ye aynı buildId'yi yazar; çalışan sekmeler bu dosyayı
// polling ile kontrol ederek yeni bir deploy olduğunu anlayıp kendini yeniler.
function writeVersionFile() {
  return {
    name: 'write-version-file',
    writeBundle(options) {
      writeFileSync(join(options.dir, 'version.txt'), buildId);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    writeVersionFile(),
    // PWA: uygulama "Ana ekrana ekle" ile kurulabilir olur (manifest) ve statik
    // varlıklar service worker ile önbelleğe alınır. autoUpdate: yeni deploy'da SW
    // kendini günceller (mevcut version.txt yenileme mekanizmasıyla uyumlu).
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon-32x32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Antalya Çalışma Rehberi',
        short_name: 'Çalışma Rehberi',
        description: 'Remote çalışanlar için mekan rehberi, sosyal akış ve iş ilanları.',
        lang: 'tr',
        theme_color: '#0f9d78',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // API çağrıları ve sürüm dosyası ASLA önbelleğe alınmaz / index.html'e
        // yönlendirilmez; her zaman ağdan taze gelir.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /\/version\.txt$/],
        globIgnores: ['**/version.txt'],
      },
      // Geliştirme (npm run dev) sırasında SW'yi devre dışı bırak; sadece build'de aktif.
      devOptions: { enabled: false },
    }),
  ],
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:4000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
