/* eslint-disable prettier/prettier */
import React, { useEffect } from 'react'

type Props = {
  className?: string
  disabledClassName?: string
}

type UpdateState = {
  updateState: 'check' | 'checking' | 'confirm-download' | 'download' | 'install' | 'latest' | 'error';
  error: string;
  progress: number;
};

type UpdateAction = 
  | { type: 'SET_STATE'; payload: UpdateState['updateState'] }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_PROGRESS'; payload: number };

const UpdateButton: React.FC<Props> = ({ className }) => {
  const [state, dispatch] = React.useReducer(
    (state: UpdateState, action: UpdateAction): UpdateState => {
      switch (action.type) {
        case 'SET_STATE': return { ...state, updateState: action.payload };
        case 'SET_ERROR': return { ...state, error: action.payload };
        case 'SET_PROGRESS': return { ...state, progress: action.payload };
        default: return state;
      }
    },
    { updateState: 'check', error: '', progress: 0 }
  );

  const handleCheckUpdate = React.useCallback((): void => {
    dispatch({ type: 'SET_STATE', payload: 'checking' });
    window.electron.ipcRenderer.send('check-for-updates');
  }, []);

  const handleInstallUpdate = React.useCallback((): void => {
    window.electron.ipcRenderer.send('confirm-install');
  }, []);

  const handleAction = React.useCallback((): void => {
    if (state.updateState === 'confirm-download') {
      dispatch({ type: 'SET_STATE', payload: 'download' });
      window.electron.ipcRenderer.send('confirm-download');
    } else if (state.updateState === 'install') {
      handleInstallUpdate();
    } else {
      handleCheckUpdate();
    }
  }, [state.updateState, handleInstallUpdate, handleCheckUpdate]);

  const handleRetry = React.useCallback((): void => {
    dispatch({ type: 'SET_ERROR', payload: '' });
    dispatch({ type: 'SET_STATE', payload: 'check' });
    handleCheckUpdate();
  }, [handleCheckUpdate]);

  useEffect((): (() => void) => {
    handleCheckUpdate();

    const handleUpdateAvailable = (): void => {
      dispatch({ type: 'SET_STATE', payload: 'confirm-download' });
    }

    const handleUpdateDownloaded = (): void => {
      dispatch({ type: 'SET_STATE', payload: 'install' });
    }

    const handleNoUpdateAvailable = (): void => {
      dispatch({ type: 'SET_STATE', payload: 'latest' });
      setTimeout(() => dispatch({ type: 'SET_STATE', payload: 'check' }), 28800000); // Reset after 8 hours (1000ms * 60 * 60 * 8)
    }

    const handleDownloadProgress = (_event: unknown, data: unknown): void => {
      const progressData = data as { 
        percent: number,
        totalBytes: number,
        transferredBytes: number 
      }
      
      // Use requestAnimationFrame for smooth UI updates
      requestAnimationFrame(() => {
        dispatch({ type: 'SET_PROGRESS', payload: Math.floor(progressData.percent) });
      })
    }

    const handleUpdateError = (_event: unknown, data: unknown): void => {
      const errorMessage = data as string
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_STATE', payload: 'error' });
    }

    window.electron.ipcRenderer.on('update-available', handleUpdateAvailable);
    window.electron.ipcRenderer.on('update-downloaded', handleUpdateDownloaded);
    window.electron.ipcRenderer.on('update-not-available', handleNoUpdateAvailable);
    window.electron.ipcRenderer.on('download-progress', handleDownloadProgress);
    window.electron.ipcRenderer.on('update-error', handleUpdateError);

    return (): void => {
      window.electron.ipcRenderer.removeListener('update-available', handleUpdateAvailable);
      window.electron.ipcRenderer.removeListener('update-downloaded', handleUpdateDownloaded);
      window.electron.ipcRenderer.removeListener('update-not-available', handleNoUpdateAvailable);
      window.electron.ipcRenderer.removeListener('download-progress', handleDownloadProgress);
      window.electron.ipcRenderer.removeListener('update-error', handleUpdateError);
    }
  }, [dispatch]);

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={state.updateState === 'error' ? handleRetry : handleAction}
        disabled={state.updateState === 'checking' || state.updateState === 'latest' || state.updateState === 'download'}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          state.updateState === 'error' 
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : state.updateState === 'download' 
            ? 'bg-blue-500 text-white'
            : state.updateState === 'install'
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : state.updateState === 'latest'
            ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        } ${className}`}
      >
        {state.updateState === 'error' && (
          <div className="flex flex-col items-center">
            <span>Update Failed</span>
            <span className="text-xs font-normal max-w-[200px] truncate" title={state.error}>
              {state.error}
            </span>
          </div>
        )}
        {state.updateState === 'check' && 'Check for Updates'}
        {state.updateState === 'checking' && 'Checking...'}
        {state.updateState === 'confirm-download' && 'Download Update'}
        {state.updateState === 'download' && 'Downloading...'}
        {state.updateState === 'install' && 'Install Now'}
        {state.updateState === 'latest' && 'Up to Date'}
      </button>
      {state.updateState === 'error' && (
        <button
          onClick={handleRetry}
          className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          title="Retry update check"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default UpdateButton 