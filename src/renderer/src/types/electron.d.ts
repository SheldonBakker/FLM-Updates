/* eslint-disable prettier/prettier */
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        on: (channel: 'update-message', func: (message: string) => void) => void
        removeListener: (channel: 'update-message', func: (message: string) => void) => void
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