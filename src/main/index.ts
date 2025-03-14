/* eslint-disable prettier/prettier */
import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import { config } from 'dotenv'
import path from 'path'
import { UpdateHandler } from './update-handler'
import { autoUpdater } from 'electron-updater'
import { dialog } from 'electron'

// Load environment variables
if (!app.isPackaged) {
  config() // Load from .env in development
} else {
  config({ path: path.join(process.resourcesPath, '.env') }) // Load from resources in production
}

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  dialog.showErrorBox(
    'Configuration Error', 
    'Missing database credentials. Please reinstall the application.'
  )
  app.quit()
}

let mainWindow: BrowserWindow | null = null
let updateHandler: UpdateHandler

function createWindow(): void {
  // Create the browser window.
  const preload = join(__dirname, '../preload/index.js')
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../../build/icon.ico'),
    backgroundColor: '#1b1b1f',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Disable sandbox for preload script
      preload,
      devTools: false
    }
  })

    //Disable the alt menu
      mainWindow.setMenuBarVisibility(false)
      mainWindow.removeMenu()


  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    updateHandler = new UpdateHandler(mainWindow)
  })

  // Load the index.html
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Add this to the createWindow function
  mainWindow.on('close', () => {
    if (updateHandler) {
      updateHandler.cancelUpdate()
    }
  })
}

// Disable auto updates
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = false

// Handle manual update checks
ipcMain.on('check-for-updates', () => {
  if (updateHandler) {
    updateHandler.checkForUpdates()
  } else {
    console.error('UpdateHandler not initialized')
  }
})

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update-available', info)
})

autoUpdater.on('update-not-available', () => {
  mainWindow?.webContents.send('update-not-available')
})

autoUpdater.on('update-downloaded', (info) => {
  mainWindow?.webContents.send('update-downloaded', info)
})

autoUpdater.on('error', (err) => {
  mainWindow?.webContents.send('update-error', err.message)
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('co.za.gunlicence')

  // Create window (which will initialize auto updater)
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Add these IPC listeners
  ipcMain.on('confirm-download', () => {
    if (updateHandler) {
      updateHandler.startDownload()
    }
  })

  ipcMain.on('confirm-install', () => {
    if (updateHandler) {
      updateHandler.installUpdate()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('show-save-dialog', async (_, options) => {
  return dialog.showSaveDialog(options);
});

ipcMain.handle('show-open-dialog', async (_, options) => {
  return dialog.showOpenDialog(options);
});

ipcMain.handle('get-credentials', () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Credentials not found in environment');
  }
  return {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY
  };
});
