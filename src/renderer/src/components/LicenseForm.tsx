/* eslint-disable prettier/prettier */
import { useState } from 'react'
import { getSupabase } from '../lib/supabase'

interface License {
  id: string
  client_id: string
  make: string
  model: string
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
  const initialFormState = {
    make: license?.make || '',
    model: license?.model || '',
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
  }

  const [formData, setFormData] = useState(initialFormState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearAndClose = (): void => {
    setFormData(initialFormState)
    setError(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabase()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('User authentication required')
      }

      if (license?.id) {
        const { error } = await supabase
          .from('gun_licences')
          .update({ 
            ...formData,
            auth_user_id: user.id
          })
          .eq('id', license.id)

        if (error) throw error
      } else {
        if (!clientId) throw new Error('Client ID required')
        
        const { error } = await supabase
          .from('gun_licences')
          .insert({ 
            ...formData,
            client_id: clientId,
            auth_user_id: user.id
          })

        if (error) throw error
      }

      onSuccess()
      clearAndClose()
    } catch (err) {
      console.error('License submission error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl p-8 w-full max-w-4xl border border-stone-700/30 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">
          {license ? 'Edit License' : 'Add New License'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Make <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Model <span className="text-stone-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
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
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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
              <label className="block text-stone-300 mb-1 text-sm">
                License Number <span className="text-orange-500">*</span>
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
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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
              <label className="block text-stone-300 mb-1 text-sm">
                Expiry Date <span className="text-orange-500">*</span>
              </label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => {
                  const date = e.target.value;
                  const year = date.split('-')[0];
                  
                  if (year.length === 4) {
                    setFormData(prev => ({ ...prev, expiry_date: date }));
                  }
                }}
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                required
                placeholder="YYYY-MM-DD"
                pattern="[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[01])"
                min="2024-01-01"
                max="2099-12-31"
              />
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