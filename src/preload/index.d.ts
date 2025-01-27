/* eslint-disable prettier/prettier */
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    electronAPI: {
      onLoadingStateChange: (callback: (loading: boolean) => void) => () => void
    }
    getCredentials: () => Promise<{
      supabaseAnonKey: string
      supabaseUrl: string
      email: string
      password: string
    }>
  }
}

export {}
