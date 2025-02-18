/* eslint-disable prettier/prettier */
interface SelectSectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SelectSection({ isOpen, onClose }: SelectSectionProps): JSX.Element {
  if (!isOpen) return <></>;

  return (
    <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-stone-800 p-8 rounded-lg shadow-xl max-w-md w-full border border-stone-700/50">
        <div className="flex flex-col items-center space-y-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-orange-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <h2 className="text-xl font-semibold text-white">Section Not Selected</h2>
          <p className="text-stone-400 text-center">
            Please select a section before running the calculation.
          </p>
          <button
            onClick={onClose}
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
