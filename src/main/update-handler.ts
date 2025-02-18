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
  }

  private totalBytes = 0;
  private transferredBytes = 0;

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
    })

    autoUpdater.on('error', (err) => {
      this.handleUpdateError(err)
    })

    autoUpdater.on('download-progress', (progressObj) => {
      this.totalBytes = progressObj.total;
      this.transferredBytes = progressObj.transferred;
      
      log.info('Download progress:', progressObj.percent);
      this.sendUpdateDataToWindow('download-progress', {
        percent: Math.floor(progressObj.percent),
        totalBytes: this.totalBytes,
        transferredBytes: this.transferredBytes
      });
    })

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info)
      this.sendUpdateDataToWindow('update-downloaded', info)
    })
  }

  private sendStatusToWindow(text: string): void {
    this.mainWindow?.webContents.send('update-message', text)
  }

  private sendUpdateDataToWindow(type: string, data?: unknown): void {
    this.mainWindow?.webContents.send('update-data', { type, data })
  }

  private updateCheckTimeout = 15000 // 15 seconds
  private retryCount = 0
  private maxRetries = 2
  private updateInProgress = false

  public checkForUpdates(): void {
    if (this.updateInProgress) return
    this.updateInProgress = true

    const timeout = setTimeout(() => {
      this.handleUpdateError(new Error('Update check timed out'))
      this.updateInProgress = false
    }, this.updateCheckTimeout)

    autoUpdater.checkForUpdates()
      .then(() => clearTimeout(timeout))
      .catch(err => {
        clearTimeout(timeout)
        this.handleUpdateError(err)
      })
      .finally(() => this.updateInProgress = false)
  }

  private handleUpdateError(err: Error): void {
    log.error('Update error:', err)
    this.sendUpdateDataToWindow('update-error', err.message)
    
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      log.info(`Retrying update check (attempt ${this.retryCount})`)
      setTimeout(() => this.checkForUpdates(), 3000)
    } else {
      this.sendStatusToWindow(`Update failed: ${err.message}`)
      this.retryCount = 0 // Reset for next check
    }
  }

  private downloadRetries = 0
  private maxDownloadRetries = 3

  public startDownload(): void {
    autoUpdater.once('error', (err) => {
      if (this.downloadRetries < this.maxDownloadRetries) {
        this.downloadRetries++
        log.warn(`Download failed, retrying (${this.downloadRetries}/${this.maxDownloadRetries})`)
        setTimeout(() => this.startDownload(), 5000)
      } else {
        this.handleUpdateError(err)
        this.downloadRetries = 0
      }
    })

    autoUpdater.downloadUpdate()
      .then(() => {
        this.downloadRetries = 0
        log.info('Download completed successfully')
      })
      .catch(err => {
        this.handleUpdateError(err)
      })
  }

  public installUpdate(): void {
    autoUpdater.quitAndInstall()
  }

  cancelUpdate(): void {
    autoUpdater.removeAllListeners()
    this.mainWindow?.webContents.send('update-cancelled')
  }
} 