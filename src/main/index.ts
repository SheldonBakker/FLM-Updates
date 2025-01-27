/* eslint-disable prettier/prettier */
import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import { config } from 'dotenv'
import path from 'path'
import { UpdateHandler } from './update-handler'

// Load environment variables from .env file
config({ path: path.join(__dirname, '../../.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Database credentials are missing in environment variables')
  throw new Error('Database credentials are required')
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
      preload,
      devTools: true
    }
  })

    // Disable the alt menu
    // mainWindow.setMenuBarVisibility(false)
    // mainWindow.removeMenu()


  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the index.html
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Initialize update handler after window creation
  updateHandler = new UpdateHandler(mainWindow)
  
  // Check for updates immediately
  updateHandler.checkForUpdates()
}

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
    updateHandler.startDownload()
  })

  ipcMain.on('confirm-install', () => {
    updateHandler.installUpdate()
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
