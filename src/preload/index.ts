/* eslint-disable prettier/prettier */
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    on: (channel: 'update-message', func: (message: string) => void): void => {
      ipcRenderer.on(channel, (_event, message) => func(message))
    },
    removeListener: (channel: 'update-message', func: (message: string) => void): void => {
      ipcRenderer.removeListener(channel, (_event, message) => func(message))
    }
  },
  process: {
    versions: process.versions
  }
})

contextBridge.exposeInMainWorld('electronAPI', {
  onLoadingStateChange: (callback: (loading: boolean) => void): (() => void) => {
    ipcRenderer.on('loading-state', (_event, isLoading) => callback(isLoading))
    return () => {
      ipcRenderer.removeAllListeners('loading-state')
    }
  }
})
