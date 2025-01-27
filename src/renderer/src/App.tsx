/* eslint-disable prettier/prettier */
/// <reference types="../../preload" />
import { useState, useEffect } from 'react'
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Navbar from './components/Navbar'
import { initializeSupabase, getSupabase } from './lib/supabase'
import Dashboard from './components/Dashboard'
import ExpiredLicenses from './components/ExpiredLicenses'
import LoadingScreen from './components/LoadingScreen'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { UpdateDialog } from './components/UpdateDialog'

interface UpdateData {
  type: 'update-available' | 'download-progress' | 'update-downloaded' | 'error' | 'update-not-available'
  data?: unknown
}

function App(): JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAppLoading, setIsAppLoading] = useState(true)
  const [updateState, setUpdateState] = useState({
    showDialog: false,
    status: 'available' as 'available' | 'downloading' | 'ready',
    progress: 0
  })

  useEffect(() => {
    const minLoadingTime = 1000 // Reduced from 3000ms to 1000ms
    const timer = setTimeout(() => {
      setIsAppLoading(false)
    }, minLoadingTime)

    return (): void => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const cleanup = window.electronAPI.onLoadingStateChange((loading) => {
      setIsLoading(loading)
    })

    return (): void => cleanup()
  }, [])

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null

    const init = async (): Promise<void> => {
      try {
        await initializeSupabase()
        const supabase = getSupabase()
        const { data: { session } } = await supabase.auth.getSession()
        
        // Check for LockManager support before setting up auth listener
        if ('locks' in navigator && navigator.locks) {
          const { data: authData } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session)
          })
          subscription = authData.subscription
        } else {
          console.warn('LockManager not supported in this browser')
          // Fallback to session check
          setIsAuthenticated(!!session)
        }

        if (session) {
          // Check if user is admin
          const { data: userData, error: userError } = await supabase
            .from('clients')
            .select('role')
            .eq('email', session.user.email)
            .single()

          if (userError || userData?.role !== 'admin') {
            await supabase.auth.signOut()
            setIsAuthenticated(false)
          } else {
            setIsAuthenticated(true)
          }
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Initialization error:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    init()

    return (): void => {
      subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let checkingToastId: number | string = ''
    
    // Show persistent checking message
    checkingToastId = toast.info('Checking for updates...', {
      position: 'bottom-right',
      autoClose: false,
      hideProgressBar: false
    })

    const handleUpdate = (_event: unknown, message: unknown): void => {
      const [, ipcMessage] = [_event as Electron.IpcRendererEvent, message as string]
      if (!ipcMessage) return
      
      let updateReceived = false;
      
      // Handle timeout for update checks
      if (ipcMessage.includes('Checking')) {
        setTimeout(() => {
          if (!updateReceived) {
            toast.dismiss(checkingToastId)
            toast.error('Update check timed out',
               {
              position: 'bottom-right',
              autoClose: 5000,
              hideProgressBar: false
            });
          }
        }, 15000);
      }

      if (ipcMessage.includes('up to date')) {
        updateReceived = true;
        toast.success(ipcMessage, {
          position: 'bottom-right',
          autoClose: 3000,
          hideProgressBar: false
        });
      } else if (ipcMessage.includes('Error')) {
        updateReceived = true;
        toast.error(ipcMessage, {
          position: 'bottom-right',
          autoClose: 5000,
          hideProgressBar: false
        });
      } else {
        toast.info(ipcMessage, {
          position: 'bottom-right',
          autoClose: 3000,
          hideProgressBar: false
        });
      }
    }

    const cleanupMessage = window.electron.ipcRenderer.on('update-message', handleUpdate)
    return cleanupMessage
  }, [])

  useEffect(() => {
    let checkingToastId: number | string = ''
    
    // Show persistent checking message
    checkingToastId = toast.info('Checking for updates...', {
      position: 'bottom-right',
      autoClose: false,
      hideProgressBar: false
    })

    const handleUpdateData = (_event: unknown, data: unknown): void => {
      const updateData = data as UpdateData | undefined
      if (!updateData) return
      
      // Dismiss checking toast when we get any result
      toast.dismiss(checkingToastId)

      switch (updateData.type) {
        case 'update-available':
          setUpdateState(prev => ({
            ...prev,
            showDialog: true,
            status: 'available',
            progress: 0
          }))
          break
        case 'download-progress':
          setUpdateState(prev => ({
            ...prev,
            status: 'downloading',
            progress: (updateData.data as { percent: number })?.percent || 0
          }))
          break
        case 'update-downloaded':
          setUpdateState(prev => ({
            ...prev,
            status: 'ready',
            showDialog: true
          }))
          break
        case 'update-not-available':
          toast.success('Application is up to date', {
            position: 'bottom-right',
            autoClose: 3000,
            hideProgressBar: false
          })
          break
        default:
          toast.error(updateData.data as string || 'Update error occurred', {
            position: 'bottom-right',
            autoClose: 5000,
            hideProgressBar: false
          })
      }
    }

    window.electron.ipcRenderer.on('update-data', handleUpdateData)
    return (): void => {
      window.electron.ipcRenderer.removeListener('update-data', handleUpdateData)
      setUpdateState(prev => ({...prev, showDialog: false}))
    }
  }, [])

  // Show loading screen if either timer hasn't finished or app is still loading
  if (isAppLoading || isLoading) {
    return <LoadingScreen />
  }

  const handleUpdateConfirm = (): void => {
    // implementation
  }

  const handleUpdateCancel = (): void => {
    // implementation
  }

  return (
    <>
      <Router>
        {isAuthenticated && <Navbar />}
        <Routes>
          <Route path="/" element={<Login onLoginSuccess={() => setIsAuthenticated(true)} />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/expired" element={isAuthenticated ? <ExpiredLicenses /> : <Navigate to="/" />} />
        </Routes>
      </Router>
      <ToastContainer />
      <UpdateDialog
        isOpen={updateState.showDialog}
        status={updateState.status}
        progress={updateState.progress}
        onConfirm={handleUpdateConfirm}
        onCancel={handleUpdateCancel}
      />
    </>
  )
}

export default App
