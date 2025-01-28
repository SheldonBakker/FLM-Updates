/* eslint-disable prettier/prettier */
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    on: (channel: 'update-message' | 'update-data' | 'update-available' | 'update-not-available' | 'update-downloaded' | 'update-error', func: (...args: unknown[]) => void): void => {
      ipcRenderer.on(channel, (event, ...args) => func(...args))
    },
    send: (channel: 'confirm-download' | 'confirm-install' | 'update-data' | 'check-for-updates', data?: unknown): void => {
      if (data) {
        ipcRenderer.send(channel, data)
      } else {
        ipcRenderer.send(channel)
      }
    },
    removeListener: (channel: 'update-message' | 'update-data' | 'update-available' | 'update-not-available' | 'update-downloaded' | 'update-error', func: (...args: unknown[]) => void): void => {
      ipcRenderer.removeListener(channel, (event, ...args) => func(...args))
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
