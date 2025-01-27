/* eslint-disable prettier/prettier */
import { useState } from 'react'

export function Version(): JSX.Element {
  const [versions] = useState(window.electron.process.versions)

  return (
    <div 
      className="fixed bottom-4 right-4 text-stone-600 text-xs cursor-pointer hover:text-orange-500 transition-colors duration-200"
    >
      Electron v{versions.electron}
    </div>
  )
} 