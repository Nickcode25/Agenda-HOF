import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    // Gera hashes de conteúdo mais estáveis para evitar problemas de cache
    rollupOptions: {
      output: {
        // Garante que os chunks tenham nomes consistentes
        manualChunks: undefined,
      },
    },
    // Aumenta o limite de aviso de tamanho de chunk
    chunkSizeWarningLimit: 1000,
  },
})
