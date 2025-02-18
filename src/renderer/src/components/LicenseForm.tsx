/* eslint-disable prettier/prettier */
import { useState, useMemo, useCallback } from 'react'
import { getSupabase } from '../lib/supabase'
import { SelectSection } from './icons/SelectSection'

interface License {
  id: string
  client_id: string
  make: string
  issue_date: string
  type: string
  caliber: string
  serial_number: string
  section: string
  expiry_date: string
  stock_code?: string
  barrel_serial?: string
  barrel_make?: string
  receiver_serial?: string
  receiver_make?: string
  frame_serial?: string
  frame_make?: string
  lic_number?: string
}

interface LicenseFormProps {
  license?: License | null
  clientId: string | null
  onClose: () => void
  onSuccess: () => void
}

export default function LicenseForm({ license, clientId, onClose, onSuccess }: LicenseFormProps): JSX.Element {
  const [showSectionModal, setShowSectionModal] = useState(false)
  // Memoize initial form state to prevent unnecessary recalculations
  const initialFormState = useMemo(() => ({
    make: license?.make || '',
    issue_date: license?.issue_date || '',
    type: license?.type || '',
    caliber: license?.caliber || '',
    serial_number: license?.serial_number || '',
    section: license?.section || '',
    expiry_date: license?.expiry_date || '',
    stock_code: license?.stock_code || '',
    barrel_serial: license?.barrel_serial || '',
    barrel_make: license?.barrel_make || '',
    receiver_serial: license?.receiver_serial || '',
    receiver_make: license?.receiver_make || '',
    frame_serial: license?.frame_serial || '',
    frame_make: license?.frame_make || '',
    lic_number: license?.lic_number || ''
  }), [license]);

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize handleDateChange to prevent unnecessary re-renders
  const handleDateChange = useCallback((dateType: 'issue' | 'expiry', value: string, isCalculation?: boolean): void => {
    const formattedValue = value.replace(/\D/g, '');
    let formattedDate = '';

    if (formattedValue.length <= 4) {
      formattedDate = formattedValue.slice(0, 4);
    } else if (formattedValue.length <= 6) {
      formattedDate = `${formattedValue.slice(0, 4)}-${formattedValue.slice(4, 6)}`;
    } else {
      formattedDate = `${formattedValue.slice(0, 4)}-${formattedValue.slice(4, 6)}-${formattedValue.slice(6, 8)}`;
    }

    setFormData(prev => {
      const newData = { ...prev, [dateType === 'issue' ? 'issue_date' : 'expiry_date']: formattedDate };
      
      // Only calculate expiry date when explicitly triggered by the button
      if (isCalculation && dateType === 'issue' && formattedDate.length === 10) {
        const issueDate = new Date(formattedDate);
        
        // Validate date before proceeding
        if (isNaN(issueDate.getTime())) {
          setError('Invalid issue date');
          return prev;
        }

        const expiryDate = new Date(issueDate);
        
        if (prev.section === 'Section 13') {
          expiryDate.setFullYear(issueDate.getFullYear() + 5);
        } else if (prev.section === 'Section 15' || prev.section === 'Section 16') {
          expiryDate.setFullYear(issueDate.getFullYear() + 10);
        }
        
        expiryDate.setDate(issueDate.getDate() - 1);
        
        // Validate expiry date before setting
        if (!isNaN(expiryDate.getTime())) {
          newData.expiry_date = expiryDate.toISOString().split('T')[0];
        } else {
          setError('Invalid expiry date calculation');
        }
      }

      return newData;
    });
  }, [formData.section]);

  // Memoize handleSubmit to prevent unnecessary re-renders
  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabase()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('User authentication required')
      }

      // Check for duplicate serial number
      const { data: existingSerial } = await supabase
        .from('gun_licences')
        .select('id')
        .eq('serial_number', formData.serial_number)
        .neq('id', license?.id || '')
        .single()

      if (existingSerial) {
        throw new Error('Serial number already exists')
      }

      // Only check for duplicate stock code if it has a value
      if (formData.stock_code && formData.stock_code.trim() !== '') {
        const { data: existingStock } = await supabase
          .from('gun_licences')
          .select('id')
          .eq('stock_code', formData.stock_code)
          .neq('id', license?.id || '')
          .single()

        if (existingStock) {
          throw new Error('Stock code already exists')
        }
      }

      // Prepare submission data, excluding empty stock_code
      const submissionData = {
        ...formData,
        auth_user_id: user.id,
        // Remove stock_code if empty
        ...(formData.stock_code?.trim() === '' && { stock_code: undefined })
      }

      if (license?.id) {
        const { error } = await supabase
          .from('gun_licences')
          .update(submissionData)
          .eq('id', license.id)

        if (error) {
          if (error.code === '23505') {
            throw new Error('Duplicate entry detected. Please check your input values.')
          }
          throw error
        }
      } else {
        if (!clientId) throw new Error('Client ID required')
        
        const { error } = await supabase
          .from('gun_licences')
          .insert({ 
            ...submissionData,
            client_id: clientId
          })

        if (error) {
          if (error.code === '23505') {
            throw new Error('Duplicate entry detected. Please check your input values.')
          }
          throw error
        }
      }

      onSuccess()
      clearAndClose()
    } catch (err) {
      console.error('License submission error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [formData, license, clientId]);

  // Memoize clearAndClose to prevent unnecessary re-renders
  const clearAndClose = useCallback((): void => {
    setFormData(initialFormState);
    setError(null);
    onClose();
  }, [initialFormState, onClose]);

  // Memoize form inputs to prevent unnecessary re-renders
  const formInputs = useMemo(() => ({
    make: {
      value: formData.make,
      onChange: (e: React.ChangeEvent<HTMLInputElement>): void => setFormData(prev => ({ ...prev, make: e.target.value }))
    },
    // ... create similar objects for other inputs ...
  }), [formData]);

  // Update the calculate expiry date button handler
  const handleCalculateExpiry = useCallback((): void => {
    if (!formData.section) {
      setShowSectionModal(true)
      return
    }
    if (['Section 13', 'Section 15', 'Section 16'].includes(formData.section)) {
      handleDateChange('issue', formData.issue_date, true)
    }
  }, [formData.section, formData.issue_date, handleDateChange])

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {/* Add SelectSection modal */}
      <SelectSection isOpen={showSectionModal} onClose={() => setShowSectionModal(false)} />
      
      <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl p-8 w-full max-w-4xl border border-stone-700/30 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">
          {license ? 'Edit License' : 'Add New License'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Make & Model <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                {...formInputs.make}
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Type <span className="text-orange-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                required
              >
                <option value="">Select Type</option>
                <option value="Handgun">Handgun</option>
                <option value="Shotgun">Shotgun</option>
                <option value="Self Loading">Self Loading</option>
                <option value="Manual Operated">Manual Operated</option>
                <option value="Combination">Combination</option>
              </select>
            </div>
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Caliber <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={formData.caliber}
                onChange={(e) => setFormData({ ...formData, caliber: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Section <span className="text-orange-500">*</span>
              </label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                required
              >
                <option value="">Select Section</option>
                <option value="Section 13">Section 13</option>
                <option value="Section 15">Section 15</option>
                <option value="Section 16">Section 16</option>
              </select>
            </div>
            <div>
              <div className="space-y-1.5">
                <label className="block text-white/80 text-sm font-semibold mb-1 tracking-wide">
                  Issue Date
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.issue_date}
                    onChange={(e) => handleDateChange('issue', e.target.value)}
                    placeholder="YYYY-MM-DD"
                    maxLength={10}
                    className="w-full p-3 bg-stone-700/50 border border-orange-500/30 rounded-lg text-white 
                      focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 
                      transition-all duration-200 backdrop-blur-2xl outline-none
                      shadow-md shadow-black/10 hover:border-orange-400/50"
                  />
                  <button
                    type="button"
                    onClick={handleCalculateExpiry}
                    className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/20 transition-colors"
                    title="Calculate Expiry Date"
                  >
                    ↻
                  </button>
                </div>
                <p className="mt-1.5 text-stone-400 text-xs">Format: YYYY-MM-DD</p>
              </div>
            </div>
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                License Number <span className="text-stone-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                defaultValue={formData.lic_number}
                onBlur={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    lic_number: e.target.value
                  }));
                }}
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Stock Code <span className="text-stone-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.stock_code}
                onChange={(e) => setFormData({ ...formData, stock_code: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <div className="space-y-1.5">
                <label className="block text-white/80 text-sm font-semibold mb-1 tracking-wide">
                  Expiry Date <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.expiry_date}
                  onChange={(e) => handleDateChange('expiry', e.target.value)}
                  placeholder="YYYY-MM-DD"
                  maxLength={10}
                  className="w-full p-3 bg-stone-700/50 border border-orange-500/30 rounded-lg text-white 
                    focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 
                    transition-all duration-200 backdrop-blur-2xl outline-none
                    shadow-md shadow-black/10 hover:border-orange-400/50"
                  required
                />
                <p className="mt-1.5 text-stone-400 text-xs">Format: YYYY-MM-DD</p>
              </div>
            </div>
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Serial Number <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* Add divider before Barrel/Frame/Receiver section */}
          <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/90 to-transparent my-10" />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Barrel <span className="text-stone-400 text-xs">(Optional)</span>
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Make"
                  value={formData.barrel_make}
                  onChange={(e) => setFormData({ ...formData, barrel_make: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                />
                <input
                  type="text"
                  placeholder="Serial"
                  value={formData.barrel_serial}
                  onChange={(e) => setFormData({ ...formData, barrel_serial: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Receiver <span className="text-stone-400 text-xs">(Optional)</span>
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Make"
                  value={formData.receiver_make}
                  onChange={(e) => setFormData({ ...formData, receiver_make: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                />
                <input
                  type="text"
                  placeholder="Serial"
                  value={formData.receiver_serial}
                  onChange={(e) => setFormData({ ...formData, receiver_serial: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Frame <span className="text-stone-400 text-xs">(Optional)</span>
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Make"
                  value={formData.frame_make}
                  onChange={(e) => setFormData({ ...formData, frame_make: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                />
                <input
                  type="text"
                  placeholder="Serial"
                  value={formData.frame_serial}
                  onChange={(e) => setFormData({ ...formData, frame_serial: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={clearAndClose}
              className="px-4 py-3 text-stone-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium shadow-xl shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 