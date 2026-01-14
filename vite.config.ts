
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
        // 2. 实施手动分块策略 (Manual Chunking)
        // 将 node_modules 中的大型库提取到独立分块，优化加载性能
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@aws-sdk')) {
              return 'vendor-aws';
            }
            if (id.includes('react')) {
              return 'vendor-react';
            }
            if (id.includes('@google/genai')) {
              return 'vendor-genai';
            }
            return 'vendor'; // 其他第三方库
          }
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
