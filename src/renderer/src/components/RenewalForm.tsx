/* eslint-disable prettier/prettier */

import React, { useCallback, useMemo } from 'react'
import { SelectSection } from './icons/SelectSection'

interface RenewalFormProps {
  renewalFormData: {
    issue_date: string
    expiry_date: string
    lic_number: string
    section: string
  }
  onRenewalSubmit: (e: React.FormEvent) => Promise<void>
  onClose: () => void
  onFormDataChange: (data: { 
    issue_date: string
    expiry_date: string
    lic_number: string
    section: string
  }) => void
}

export function RenewalForm({
  renewalFormData,
  onRenewalSubmit,
  onClose,
  onFormDataChange
}: RenewalFormProps): React.JSX.Element {
  const [showSectionError, setShowSectionError] = React.useState(false)
  const [dateError, setDateError] = React.useState<string | null>(null)

  const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString)
    return !isNaN(date.getTime()) && dateString.length === 10
  }

  const handleDateChange = (dateType: 'issue' | 'expiry', value: string, isCalculation?: boolean): void => {
    const formattedValue = value.replace(/\D/g, '')
    const formattedDate = formatDateString(formattedValue)
    
    if (formattedDate.length === 10 && !isValidDate(formattedDate)) {
      setDateError('Please enter a valid date in YYYY-MM-DD format')
      return
    }
    setDateError(null)

    const newData = { 
      ...renewalFormData, 
      [dateType === 'issue' ? 'issue_date' : 'expiry_date']: formattedDate 
    }

    if (isCalculation && dateType === 'issue' && formattedDate.length === 10) {
      const expiryDate = calculateExpiryDate(formattedDate, renewalFormData.section)
      newData.expiry_date = expiryDate.toISOString().split('T')[0]
    }

    onFormDataChange(newData)
  }

  const formatDateString = (value: string): string => {
    if (value.length <= 4) return value.slice(0, 4)
    if (value.length <= 6) return `${value.slice(0, 4)}-${value.slice(4, 6)}`
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
  }

  const calculateExpiryDate = (dateString: string, section: string): Date => {
    const issueDate = new Date(dateString)
    const expiryDate = new Date(issueDate)
    
    const yearsToAdd = section === 'Section 13' ? 5 : 10
    expiryDate.setFullYear(issueDate.getFullYear() + yearsToAdd)
    expiryDate.setDate(issueDate.getDate() - 1)
    
    return expiryDate
  }

  const inputClasses = "w-full p-3 bg-stone-700/50 border border-orange-500/30 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all duration-200 backdrop-blur-2xl outline-none shadow-md shadow-black/10 hover:border-orange-400/50"

  // Memoize handlers to prevent unnecessary re-renders
  const handleSectionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFormDataChange({ ...renewalFormData, section: e.target.value })
  }, [renewalFormData, onFormDataChange])

  const handleIssueDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleDateChange('issue', e.target.value)
  }, [handleDateChange])

  const handleExpiryDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    const formattedDate = formatDateString(value)
    onFormDataChange({ ...renewalFormData, expiry_date: formattedDate })
  }, [renewalFormData, onFormDataChange])

  const handleLicenseNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFormDataChange({
      ...renewalFormData,
      lic_number: e.target.value
    })
  }, [renewalFormData, onFormDataChange])

  // Memoize the form container to prevent unnecessary re-renders
  const formContainer = useMemo(() => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md border border-stone-700/30 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Renew License</h2>
        
        <form onSubmit={onRenewalSubmit} className="space-y-6">
          <div>
            <label className="block text-stone-300 mb-1 text-sm">
              Section <span className="text-orange-500">*</span>
            </label>
            <select
              value={renewalFormData.section}
              onChange={handleSectionChange}
              className={inputClasses}
              required
            >
              <option value="">Select Section</option>
              <option value="Section 13">Section 13</option>
              <option value="Section 15">Section 15</option>
              <option value="Section 16">Section 16</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-white/80 text-sm font-semibold mb-1 tracking-wide">
              Issue Date
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={renewalFormData.issue_date}
                onChange={handleIssueDateChange}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (!renewalFormData.section) {
                      setShowSectionError(true)
                      return
                    }
                    handleDateChange('issue', renewalFormData.issue_date, true)
                  }
                }}
                placeholder="YYYY-MM-DD"
                maxLength={10}
                className={inputClasses}
              />
              <button
                type="button"
                tabIndex={0}
                onClick={() => {
                  if (!renewalFormData.section) {
                    setShowSectionError(true)
                    return
                  }
                  handleDateChange('issue', renewalFormData.issue_date, true)
                }}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (!renewalFormData.section) {
                      setShowSectionError(true)
                      return
                    }
                    handleDateChange('issue', renewalFormData.issue_date, true)
                  }
                }}
                className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-white rounded-lg hover:bg-orange-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                title="Calculate Expiry Date"
              >
                CALCULATE
              </button>
            </div>
            <p className="mt-1.5 text-stone-400 text-xs">Format: YYYY-MM-DD</p>
            {dateError && (
              <p className="text-red-500 text-sm mt-1">{dateError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-white/80 text-sm font-semibold mb-1 tracking-wide">
              Expiry Date <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={renewalFormData.expiry_date}
              onChange={handleExpiryDateChange}
              placeholder="YYYY-MM-DD"
              maxLength={10}
              className={`${inputClasses} select-none cursor-default`}
              required
              readOnly
            />
            <p className="mt-1.5 text-stone-400 text-xs">Format: YYYY-MM-DD</p>
          </div>

          <div>
            <label className="block text-stone-300 mb-1 text-sm">
              New License Number
            </label>
            <input
              type="text"
              value={renewalFormData.lic_number}
              onChange={handleLicenseNumberChange}
              className={inputClasses}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 text-stone-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium shadow-xl shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Renew License
            </button>
          </div>
        </form>
      </div>
      <SelectSection isOpen={showSectionError} onClose={() => setShowSectionError(false)} />
    </div>
  ), [onRenewalSubmit, onClose, renewalFormData, onFormDataChange, showSectionError, dateError])

  return formContainer
} 