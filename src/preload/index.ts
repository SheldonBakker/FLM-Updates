/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { contextBridge, ipcRenderer } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

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
    showSaveDialog: (options: Electron.SaveDialogOptions) => ipcRenderer.invoke('show-save-dialog', options),
    removeListener: (channel: 'update-message' | 'update-data' | 'update-available' | 'update-not-available' | 'update-downloaded' | 'update-error', func: (...args: unknown[]) => void): void => {
      ipcRenderer.removeListener(channel, (event, ...args) => func(...args))
    }
  },
  process: {
    versions: process.versions
  },
  appVersion: process.env.npm_package_version
})

contextBridge.exposeInMainWorld('electronAPI', {
  onLoadingStateChange: (callback: (loading: boolean) => void): (() => void) => {
    ipcRenderer.on('loading-state', (_event, isLoading) => callback(isLoading))
    return () => {
      ipcRenderer.removeAllListeners('loading-state')
    }
  },
  showOpenDialog: (options: Electron.OpenDialogOptions) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options: Electron.SaveDialogOptions) => ipcRenderer.invoke('show-save-dialog', options),
  path: require('path'),
  fs: require('fs'),
  getCredentials: () => ipcRenderer.invoke('get-credentials')
})