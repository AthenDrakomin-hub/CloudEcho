
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 1. 调整分块大小警告阈值到 1000kB，消除 500kB 的警告
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 2. 简化分块策略，避免循环依赖
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-aws': ['@aws-sdk/client-s3'],
          'vendor-genai': ['@google/genai']
        },
        // 3. 优化分块命名，利于缓存
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // 4. 开启压缩优化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});