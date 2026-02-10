import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/',           // Zorg dat alle paden correct zijn
  build: {
    outDir: 'dist',    // Output folder
    emptyOutDir: true  // Maak dist schoon bij elke build
  },
})
