import { fileURLToPath, URL } from "url";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from "vite-plugin-svgr";



// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),svgr()],
  resolve: {
    alias: [
      { find: 'src', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],}
})
