import { writeFileSync } from 'fs';
import { join } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
  plugins: [react(), writeVersionFile()],
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
