import { defineConfig, type ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const prettyLog = () => {
  return {
    name: 'custom-print',
    configureServer(server: ViteDevServer) {
      server.printUrls = () => {
        console.log('\n')
        console.log('  ╔═══════════════════════════════════════════╗')
        console.log('  ║    📱 FORGY MOBILE APP                    ║')
        console.log(`  ║    ➜ Local:   http://localhost:${server.config.server.port}        ║`)
        console.log('  ║    ➜ Network: Accesible en tu Wi-Fi       ║')
        console.log('  ╚═══════════════════════════════════════════╝')
        console.log('\n')
      }
    }
  }
}

export default defineConfig({
  plugins: [vue(), prettyLog()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  server: {
    port: 5173,
    host: true,
    strictPort: true
  }
})