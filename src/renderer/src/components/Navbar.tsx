/* eslint-disable prettier/prettier */
import { useNavigate, useLocation } from 'react-router-dom'
import { getSupabase } from '../lib/supabase'
import electronLogo from '../assets/logo.png'
import UpdateButton from './UpdateButton'
import React, { useCallback } from 'react'

function Navbar(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Memoize the logout handler
  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      await getSupabase().auth.signOut()
      navigate('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }, [navigate])

  // Memoize the navigation handlers
  const navigateTo = useCallback((path: string): () => void => () => navigate(path), [navigate])

  // Memoize the active path check
  const isActive = useCallback((path: string): boolean => location.pathname === path, [location.pathname])

  // Memoize the link component to prevent unnecessary re-renders
  const NavLink = useCallback(({ path, label, gradient }: { 
    path: string; 
    label: string; 
    gradient: string 
  }) => (
    <button
      onClick={navigateTo(path)}
      className={`relative px-4 py-2 rounded-md transition-all duration-200 group ${
        isActive(path)
          ? 'text-white bg-stone-800/60'
          : 'text-stone-300 hover:text-white hover:bg-stone-800/40'
      }`}
    >
      {label}
      <span
        className={`absolute inset-x-0 -bottom-[1px] h-[2px] ${gradient} transform transition-transform duration-200 ${
          isActive(path) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
        }`}
      />
    </button>
  ), [navigateTo, isActive])

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
                alt="Gunlicence Logo" 
                className="w-8 h-8"
                loading="lazy"
              />
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                Gunlicence
              </div>
              <UpdateButton 
                className="!p-1 !text-xs bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-md shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20" 
                disabledClassName="opacity-50 cursor-not-allowed"
              />
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-2">
              <NavLink 
                path="/dashboard" 
                label="Clients" 
                gradient="bg-gradient-to-r from-orange-500 to-orange-600" 
              />
              <NavLink 
                path="/licenses" 
                label="Licenses" 
                gradient="bg-gradient-to-r from-orange-500 to-orange-600" 
              />
              <NavLink 
                path="/expired" 
                label="Expired Licenses" 
                gradient="bg-gradient-to-r from-red-500 to-red-600" 
              />
              <NavLink 
                path="/checklist" 
                label="Checklist" 
                gradient="bg-gradient-to-r from-orange-500 to-orange-600" 
              />
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

export default React.memo(Navbar) 