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

function App(): JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAppLoading, setIsAppLoading] = useState(true)

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
        
        // Set up auth listener after initialization
        const { data: authData } = supabase.auth.onAuthStateChange((_event, session) => {
          setIsAuthenticated(!!session)
        })
        subscription = authData.subscription

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
    // Show initial checking message
    toast.info('Checking for updates...', {
      position: 'bottom-right',
      autoClose: 3000,
      hideProgressBar: false
    })

    const handleUpdate = (_event: Electron.IpcRendererEvent, message: string): void => {
      if (!message) return;
      
      if (message.includes('up to date')) {
        toast.success(message, {
          position: 'bottom-right',
          autoClose: 3000,
          hideProgressBar: false
        })
      } else if (message.includes('Error')) {
        toast.error(message, {
          position: 'bottom-right',
          autoClose: 5000,
          hideProgressBar: false
        })
      } else {
        toast.info(message, {
          position: 'bottom-right',
          autoClose: 3000,
          hideProgressBar: false
        })
      }
    }

    window.electron.ipcRenderer.on('update-message', handleUpdate)
    
    return (): void => {
      window.electron.ipcRenderer.removeListener('update-message', handleUpdate)
    }
  }, [])

  // Show loading screen if either timer hasn't finished or app is still loading
  if (isAppLoading || isLoading) {
    return <LoadingScreen />
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
    </>
  )
}

export default App
