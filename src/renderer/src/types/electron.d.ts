/* eslint-disable prettier/prettier */
import { OpenDialogOptions, OpenDialogReturnValue, SaveDialogOptions, SaveDialogReturnValue } from 'electron';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        on: <T>(channel: 'update-message' | 'update-data', listener: (event: Electron.IpcRendererEvent, args: T) => void) => void
        send: <T>(channel: 'confirm-download' | 'confirm-install' | 'update-data', args?: T) => void
        removeListener: <T>(channel: 'update-message' | 'update-data', listener: (event: Electron.IpcRendererEvent, args: T) => void) => void
      }
      process: {
        versions: NodeJS.ProcessVersions
      }
    }
    electronAPI: {
      getCredentials: () => Promise<{
        supabaseUrl: string;
        supabaseAnonKey: string;
      }>;
      onLoadingStateChange: (callback: (loading: boolean) => void) => () => void
      showOpenDialog: (options: OpenDialogOptions) => Promise<OpenDialogReturnValue>
      showSaveDialog: (options: SaveDialogOptions) => Promise<SaveDialogReturnValue>
      path: NodeJS.PlatformPath
      fs: typeof import('fs')
    }
  }
}

export {} 