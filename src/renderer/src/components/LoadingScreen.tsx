/* eslint-disable prettier/prettier */
import { useEffect, useState } from 'react'
import logo from '../assets/logo.png'

const LoadingScreen = (): JSX.Element => {
  const [progress, setProgress] = useState<number>(0)
  const [startTime] = useState<number>(Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsedTime = Date.now() - startTime
      const percentage = (elapsedTime / 3000) * 100
      
      if (elapsedTime >= 3000) {
        setProgress(100)
        clearInterval(timer)
      } else {
        setProgress(percentage)
      }
    }, 16)

    return (): void => clearInterval(timer)
  }, [startTime])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950">
      <div className="relative mb-12 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-orange-900 rounded-full blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
        <img 
          src={logo} 
          alt="Gunlicence Logo" 
          className="relative h-32 mx-auto drop-shadow-2xl animate-loading-pulse"
        />
      </div>
      
      <div className="w-64 h-1.5 bg-stone-800/50 rounded-full overflow-hidden backdrop-blur-sm ring-1 ring-stone-800/60">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 rounded-full transition-all duration-300 ease-out shadow-lg"
          style={{ 
            width: `${progress}%`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite',
          }}
        />
      </div>
      
      <p className="mt-6 text-stone-400 text-sm font-medium tracking-wide">
        Loading<span className="animate-pulse">...</span>
      </p>
    </div>
  )
}

export default LoadingScreen 