import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/aws-ccp-quiz-webapp/', // 👈 this must match your GitHub repo name
  plugins: [react()],
});