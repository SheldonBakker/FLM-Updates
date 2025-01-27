/* eslint-disable prettier/prettier */
import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'
import log from 'electron-log'

export class UpdateHandler {
  constructor(private mainWindow: BrowserWindow) {
    log.transports.file.level = 'debug'
    autoUpdater.logger = log
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
    
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'SheldonBakker',
      repo: 'FLM-',
      token: process.env.GH_TOKEN
    })

    this.initializeAutoUpdater()
    this.checkForUpdates()
  }

  private initializeAutoUpdater(): void {
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...')
      this.sendStatusToWindow('Checking for updates...')
    })

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info)
      this.sendStatusToWindow('Update available. Downloading...')
    })

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info)
      this.sendStatusToWindow('Application is up to date.')
    })

    autoUpdater.on('error', (err) => {
      log.error('Error in auto-updater:', err)
      this.sendStatusToWindow(`Error in auto-updater: ${err.message}`)
    })

    autoUpdater.on('download-progress', (progressObj) => {
      log.info('Download progress:', progressObj)
      this.sendStatusToWindow(
        `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`
      )
    })

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info)
      this.sendStatusToWindow('Update downloaded. Will install on restart.')
    })
  }

  private sendStatusToWindow(text: string): void {
    this.mainWindow.webContents.send('update-message', text)
  }

  public checkForUpdates(): void {
    autoUpdater.checkForUpdates()
  }
} 