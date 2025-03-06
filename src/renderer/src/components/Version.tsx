/* eslint-disable prettier/prettier */
import { useState, useEffect } from 'react'

export function Version(): React.JSX.Element {
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    const getVersion = async (): Promise<void> => {
      const appVersion = await window.electron.appVersion
      setVersion(appVersion)
    }
    getVersion()
  }, [])

  return (
    <div 
      className="fixed bottom-4 right-4 text-stone-600 text-xs cursor-pointer hover:text-orange-500 transition-colors duration-200"
    >
      v{version}
    </div>
  )
} 