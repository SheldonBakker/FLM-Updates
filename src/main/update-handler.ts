/* eslint-disable prettier/prettier */
import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'
import log from 'electron-log'

export class UpdateHandler {
  constructor(private mainWindow: BrowserWindow) {
    log.transports.file.level = 'debug'
    autoUpdater.logger = log
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false

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
      this.sendUpdateDataToWindow('update-available', info)
    })

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info)
      this.sendStatusToWindow('Application is up to date.')
      this.sendUpdateDataToWindow('update-not-available')
      this.mainWindow?.webContents.send('update-available')
    })

    autoUpdater.on('error', (err) => {
      this.handleUpdateError(err)
    })

    autoUpdater.on('download-progress', (progressObj) => {
      this.sendUpdateDataToWindow('download-progress', progressObj)
    })

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info)
      this.sendUpdateDataToWindow('update-downloaded', info)
    })
  }

  private sendStatusToWindow(text: string): void {
    this.mainWindow.webContents.send('update-message', text)
  }

  private sendUpdateDataToWindow(type: string, data?: unknown): void {
    this.mainWindow.webContents.send('update-data', { type, data })
  }

  private updateCheckTimeout = 15000 // 15 seconds
  private retryCount = 0
  private maxRetries = 2

  public checkForUpdates(): void {
    const timeout = setTimeout(() => {
      this.handleUpdateError(new Error('Update check timed out'))
    }, this.updateCheckTimeout)

    autoUpdater.checkForUpdates().then(() => {
      clearTimeout(timeout)
    }).catch(err => {
      clearTimeout(timeout)
      this.handleUpdateError(err)
    })
  }

  private handleUpdateError(err: Error): void {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      log.info(`Retrying update check (attempt ${this.retryCount})`)
      setTimeout(() => this.checkForUpdates(), 3000)
    } else {
      this.sendStatusToWindow(`Update failed: ${err.message}`)
      log.error('Final update check failure:', err)
      this.retryCount = 0 // Reset for next check
    }
  }

  public startDownload(): void {
    autoUpdater.downloadUpdate()
  }

  public installUpdate(): void {
    autoUpdater.quitAndInstall()
  }
} 