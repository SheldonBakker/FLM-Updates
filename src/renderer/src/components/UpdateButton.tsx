/* eslint-disable prettier/prettier */
import React, { useEffect } from 'react'

type Props = {
  className?: string
  disabledClassName?: string
}

const UpdateButton: React.FC<Props> = ({ className }) => {
  const [updateState, setUpdateState] = React.useState<'check' | 'checking' | 'confirm-download' | 'download' | 'install' | 'latest' | 'error'>('check')
  const [, setProgress] = React.useState(0)
  const [error, setError] = React.useState<string>('')
  const [, setTotalBytes] = React.useState(0)
  const [,setTransferredBytes] = React.useState(0)

  const handleCheckUpdate = (): void => {
    setUpdateState('checking')
    window.electron.ipcRenderer.send('check-for-updates')
  }

  const handleInstallUpdate = (): void => {
    window.electron.ipcRenderer.send('confirm-install')
  }

  useEffect((): (() => void) => {
    const handleUpdateAvailable = (): void => {
      setUpdateState('confirm-download')
    }

    const handleUpdateDownloaded = (): void => {
      setUpdateState('install')
    }

    const handleNoUpdateAvailable = (): void => {
      setUpdateState('latest')
      setTimeout(() => setUpdateState('check'), 3000) // Reset after 3 seconds
    }

    const handleDownloadProgress = (_event: unknown, data: unknown): void => {
      const progressData = data as { 
        percent: number,
        totalBytes: number,
        transferredBytes: number 
      }
      
      // Use requestAnimationFrame for smooth UI updates
      requestAnimationFrame(() => {
        setProgress(Math.floor(progressData.percent))
        setTotalBytes(progressData.totalBytes)
        setTransferredBytes(progressData.transferredBytes)
      })
    }

    const handleUpdateError = (_event: unknown, data: unknown): void => {
      const errorMessage = data as string
      setError(errorMessage)
      setUpdateState('error')
    }

    window.electron.ipcRenderer.on('update-available', handleUpdateAvailable)
    window.electron.ipcRenderer.on('update-downloaded', handleUpdateDownloaded)
    window.electron.ipcRenderer.on('update-not-available', handleNoUpdateAvailable)
    window.electron.ipcRenderer.on('download-progress', handleDownloadProgress)
    window.electron.ipcRenderer.on('update-error', handleUpdateError)

    return (): void => {
      window.electron.ipcRenderer.removeListener('update-available', handleUpdateAvailable)
      window.electron.ipcRenderer.removeListener('update-downloaded', handleUpdateDownloaded)
      window.electron.ipcRenderer.removeListener('update-not-available', handleNoUpdateAvailable)
      window.electron.ipcRenderer.removeListener('download-progress', handleDownloadProgress)
      window.electron.ipcRenderer.removeListener('update-error', handleUpdateError)
    }
  }, [])

  const handleAction = (): void => {
    if (updateState === 'confirm-download') {
      setUpdateState('download')
      window.electron.ipcRenderer.send('confirm-download')
    } else if (updateState === 'install') {
      handleInstallUpdate()
    } else {
      handleCheckUpdate()
    }
  }

  const handleRetry = (): void => {
    setError('')
    setUpdateState('check')
    handleCheckUpdate()
  }


  return (
    <button 
      onClick={updateState === 'error' ? handleRetry : handleAction}
      disabled={updateState === 'checking' || updateState === 'latest' || updateState === 'download'}
      className={`px-4 py-2 ${
        updateState === 'error' 
          ? 'bg-red-500 hover:bg-red-600'
          : updateState === 'download' 
          ? 'bg-gradient-to-r from-orange-500 to-green-500 text-white animate-pulse'
          : updateState === 'install'
          ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
          : updateState === 'latest'
          ? 'bg-gradient-to-r from-green-500 to-green-600'
          : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
      } rounded-md shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all duration-200 ${className} ${updateState === 'confirm-download' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}`}
    >
      {updateState === 'error' && `Error: ${error} - Retry`}
      {updateState === 'check' && 'Check for Updates'}
      {updateState === 'checking' && 'Checking...'}
      {updateState === 'confirm-download' && 'Confirm Download'}
      {updateState === 'download' && 'Please wait...'}
      {updateState === 'install' && 'Install Update'}
      {updateState === 'latest' && 'Latest Build'}
    </button>
  )
}

export default UpdateButton 