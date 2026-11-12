import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { parseProxyTarget, parsePublicEnv } from './src/shared/config/env-schema.ts'

export default defineConfig(({ mode }) => {
  const values = loadEnv(mode, process.cwd(), '')
  parsePublicEnv(values)
  const target = parseProxyTarget(values.API_PROXY_TARGET)

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': { target, changeOrigin: true },
        '/actuator': { target, changeOrigin: true },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router/')) {
              return 'vendor-react'
            }
            if (id.includes('node_modules/antd/') || id.includes('node_modules/@ant-design/')) {
              return 'vendor-antd'
            }
            if (id.includes('node_modules/@tanstack/react-query/')) {
              return 'vendor-query'
            }
          },
        },
      },
    },
  }
})
