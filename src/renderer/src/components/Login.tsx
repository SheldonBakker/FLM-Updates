/* eslint-disable prettier/prettier */
import { useState, useEffect } from 'react'
import '../assets/main.css'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { getSupabase } from '../lib/supabase'
import LoadingScreen from './LoadingScreen'

function Login({ onLoginSuccess }: { onLoginSuccess: () => void }): JSX.Element {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      try {
        const { data: { session } } = await getSupabase().auth.getSession()
        if (session) {
          const { data: userData, error: userError } = await getSupabase()
            .from('clients')
            .select('role')
            .eq('email', session.user.email)
            .single()

          if (userError || userData?.role !== 'admin') {
            await getSupabase().auth.signOut()
            setError('Access denied. Admin privileges required.')
          } else {
            onLoginSuccess()
            navigate('/dashboard')
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [navigate, onLoginSuccess])

  const handleLogin = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const { error: signInError } = await getSupabase().auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        const errorMessage = signInError.message === 'Why no Email Hmmmm??' 
          ? 'Missing email'
          : signInError.message
        setError(errorMessage)
        setMessage('')
        return
      }

      // Check if user is admin before proceeding
      const { data: userData, error: userError } = await getSupabase()
        .from('clients')
        .select('role')
        .eq('email', email)
        .single()

      if (userError || !userData) {
        setError('Error verifying user permissions')
        await getSupabase().auth.signOut()
        return
      }

      if (userData.role !== 'admin') {
        setError('Access denied. Admin privileges required.')
        await getSupabase().auth.signOut()
        return
      }

      setError('')
      setMessage('Login successful!')
      onLoginSuccess()
      navigate('/dashboard')
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-stone-900 to-stone-800">
      <div className="w-full max-w-md p-8 space-y-8 bg-stone-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-stone-700/30">
        <div className="text-center">
          <img 
            src={logo} 
            alt="Gunlicence Logo" 
            className="h-28 mx-auto mb-2 drop-shadow-2xl"
          />
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Welcome back
          </h2>
          <p className="text-sm text-stone-400">Please sign in to your account</p>
        </div>

        <div className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
            />
          </div>
          <button 
            onClick={handleLogin} 
            className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium shadow-xl shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Sign in
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </div>
        )}
        {message && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-green-400 text-center">{message}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
