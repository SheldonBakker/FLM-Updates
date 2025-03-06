/* eslint-disable prettier/prettier */
/// <reference types="../../preload" />
import { useState, useEffect } from 'react'
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Navbar from './pages/Navbar'
import { initializeSupabase, getSupabase } from './lib/supabase'
import Dashboard from './pages/Dashboard'
import ExpiredLicenses from './pages/ExpiredLicenses'
import LoadingScreen from './components/LoadingScreen'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import LicensesPage from './pages/LicensesPage'
import DocScript from './pages/DocScript'


function App(): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAppLoading, setIsAppLoading] = useState(true)

  useEffect(() => {
    const minLoadingTime = 1000 
    const timer = setTimeout(() => {
      setIsAppLoading(false)
    }, minLoadingTime)

    return (): void => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!window.electronAPI && process.env.NODE_ENV !== 'development') {
      console.warn('electronAPI is not available - running in development mode')
      return
    }
    
    const cleanup = window.electronAPI?.onLoadingStateChange?.((loading) => {
      setIsLoading(loading)
    })

    return (): void => cleanup?.()
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
          <Route path="/licenses" element={isAuthenticated ? <LicensesPage /> : <Navigate to="/" />} />
          <Route path="/docscript" element={isAuthenticated ? <DocScript /> : <Navigate to="/" />} />
        </Routes>
      </Router>
      <ToastContainer />
    </>
  )
}

export default App
