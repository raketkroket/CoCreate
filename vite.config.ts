import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  root: '.',  // root van je source, hier de folder waar index.html staat
  build: {
    outDir: 'dist',
  },
})
