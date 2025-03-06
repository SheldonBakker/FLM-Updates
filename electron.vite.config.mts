/* eslint-disable prettier/prettier */
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react-swc'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      build: {
        outDir: 'dist/main',
        rollupOptions: {  
          input: {
            index: resolve(__dirname, 'src/main/index.ts')
          },
          external: ['dotenv']
        }
      },
      resolve: {
        alias: {
          '@': resolve('src')
        }
      },
      define: {
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY)
      }
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
      build: {
        outDir: 'dist/preload',
        rollupOptions: {
          external: ['path', 'fs']
        }
      }
    },
    renderer: {
      build: {
        outDir: 'dist/renderer'
      },
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src')
        }
      },
      plugins: [react()],
      define: {
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY)
      }
    }
  }
})
