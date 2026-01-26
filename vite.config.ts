
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env.SUPABASE_S3_ENDPOINT': JSON.stringify(process.env.SUPABASE_S3_ENDPOINT),
    'process.env.SUPABASE_S3_REGION': JSON.stringify(process.env.SUPABASE_S3_REGION),
    'process.env.SUPABASE_S3_ACCESS_KEY_ID': JSON.stringify(process.env.SUPABASE_S3_ACCESS_KEY_ID),
    'process.env.SUPABASE_S3_SECRET_ACCESS_KEY': JSON.stringify(process.env.SUPABASE_S3_SECRET_ACCESS_KEY),
    'process.env.SUPABASE_S3_BUCKET': JSON.stringify(process.env.SUPABASE_S3_BUCKET),
    'process.env.SUPABASE_AUTH_URL': JSON.stringify(process.env.SUPABASE_AUTH_URL),
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
});
