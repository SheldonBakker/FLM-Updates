/* eslint-disable prettier/prettier */
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
      onLoadingStateChange: (callback: (loading: boolean) => void) => () => void
    }
  }
}

export {} 