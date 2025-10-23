import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'static/assets',
    rollupOptions: {
      output: {
        entryFileNames: 'static/assets/index-[hash].js',
        chunkFileNames: 'static/assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          if (name.endsWith('.css')) {
            return 'static/assets/index-[hash].css';
          }
          if (name === 'icon.png') {
            return 'static/assets/icon-[hash].png';
          }
          return 'static/assets/[name]-[hash].[ext]';
        },
      },
    },
  },
});
