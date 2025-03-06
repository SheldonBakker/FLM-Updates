/* eslint-disable prettier/prettier */
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        on: (
          channel: 'update-message' | 'update-data' | 'update-available' | 'update-downloaded' | 'update-not-available' | 'download-progress' | 'update-error',
          func: (...args: unknown[]) => void
        ) => void
        send: (channel: 'confirm-download' | 'confirm-install' | 'update-data' | 'check-for-updates', data?: unknown) => void
        removeListener: (
          channel: 'update-message' | 'update-data' | 'update-available' | 'update-downloaded' | 'update-not-available' | 'download-progress' | 'update-error',
          func: (...args: unknown[]) => void
        ) => void
      }
      process: {
        versions: NodeJS.ProcessVersions
      }
      appVersion: string;
      path: typeof import('path')
    }
    api: unknown
    electronAPI?: {
      getCredentials(): unknown
      onLoadingStateChange: (callback: (loading: boolean) => void) => () => void
      showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>
      showSaveDialog: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>
      path: typeof import('path')
      fs: typeof import('fs')
    }
    getCredentials: () => Promise<{
      supabaseAnonKey: string
      supabaseUrl: string
      email: string
      password: string
    }>
  }
}

interface ElectronAPI {
  ipcRenderer: {
    on: <T>(channel: string, listener: (event: Electron.IpcRendererEvent, args: T) => void) => void
    off: <T>(channel: string, listener: (event: Electron.IpcRendererEvent, args: T) => void) => void
    send: <T>(channel: string, args?: T) => void
  }
}

export {}
