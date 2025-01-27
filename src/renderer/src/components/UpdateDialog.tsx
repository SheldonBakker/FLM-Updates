/* eslint-disable prettier/prettier */
interface UpdateDialogProps {
  isOpen: boolean
  progress?: number
  status: 'available' | 'downloading' | 'ready'
  onConfirm: () => void
  onCancel: () => void
}

export function UpdateDialog({
  isOpen,
  progress,
  status,
  onConfirm,
  onCancel
}: UpdateDialogProps): JSX.Element | null {
  if (!isOpen) return null

  const messages = {
    available: 'A new version is available. Download now?',
    downloading: 'Downloading update...',
    ready: 'Update downloaded. Install now?'
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-stone-800 border border-stone-700 rounded-lg p-6 w-[400px] space-y-4">
        <h3 className="text-xl font-semibold text-white">Software Update</h3>

        {status === 'downloading' && (
          <div className="space-y-2">
            <div className="h-2 bg-stone-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-stone-400 text-right">{progress?.toFixed(0)}%</p>
          </div>
        )}

        <p className="text-stone-300">{messages[status]}</p>

        <div className="flex justify-end gap-3">
          {status !== 'downloading' && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-lg transition-colors"
            >
              {status === 'ready' ? 'Later' : 'Cancel'}
            </button>
          )}
          {status !== 'downloading' && (
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              {status === 'ready' ? 'Install Now' : 'Download'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
