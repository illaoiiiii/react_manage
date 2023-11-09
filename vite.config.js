import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

const resolve = (dir) => path.join(__dirname, dir)

// https://vitejs.dev/config/
export default defineConfig({
  resolve:{
    alias: {
      '@': path.resolve('./src'),
    },
  },
  plugins: [react()],
})
