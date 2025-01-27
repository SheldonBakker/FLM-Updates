/* eslint-disable prettier/prettier */
import { useNavigate, useLocation } from 'react-router-dom'
import { getSupabase } from '../lib/supabase'
import electronLogo from '../assets/logo.png'

function Navbar(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  

  const handleLogout = async (): Promise<void> => {
    try {
      await getSupabase().auth.signOut()
      navigate('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-stone-900/95 border-b border-stone-700/30 shadow-lg">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left section with logo and navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img 
                src={electronLogo} 
                alt="Electron Logo" 
                className="w-8 h-8 animate-spin-slow"
              />
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                Gunlicence
                <span className="text-sm font-normal text-stone-400 ml-2">v0.6.0</span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/dashboard')}
                className={`relative px-4 py-2 rounded-md transition-all duration-200 group ${
                  location.pathname === '/dashboard'
                    ? 'text-white bg-stone-800/60'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/40'
                }`}
              >
                Dashboard
                <span
                  className={`absolute inset-x-0 -bottom-[1px] h-[2px] bg-gradient-to-r from-orange-500 to-orange-600 transform transition-transform duration-200 ${
                    location.pathname === '/dashboard' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </button>
              <button
                onClick={() => navigate('/expired')}
                className={`relative px-4 py-2 rounded-md transition-all duration-200 group ${
                  location.pathname === '/expired'
                    ? 'text-white bg-stone-800/60'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/40'
                }`}
              >
                Expired Licenses
                <span
                  className={`absolute inset-x-0 -bottom-[1px] h-[2px] bg-gradient-to-r from-red-500 to-red-600 transform transition-transform duration-200 ${
                    location.pathname === '/expired' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Right section with logout */}
          <button
            onClick={handleLogout}
            className="relative px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-md font-medium 
            shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20
            before:absolute before:inset-0 before:bg-gradient-to-r before:from-orange-600 before:to-orange-700
            before:opacity-0 before:transition-opacity before:duration-200 before:rounded-md hover:before:opacity-100
            transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
          >
            <span className="relative">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 