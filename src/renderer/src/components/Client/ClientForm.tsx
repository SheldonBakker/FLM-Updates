/* eslint-disable prettier/prettier */
import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { getSupabase } from '../../lib/supabase'
import { debounce } from 'lodash'

declare global {
  interface Window {
    initAutocomplete?: () => void
  }
}

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postal_code: string
  id_number: string
  club_provider?: 'PHASA' | 'NATSHOOT' | null
  username?: string
  password?: string
}

interface ClientFormProps {
  client?: Client | null
  onClose: () => void
  onSuccess: () => void
}

interface ClientFormState {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postal_code: string
  id_number: string
  club_provider: 'PHASA' | 'NATSHOOT' | null
  username: string
  password: string
}

export default memo(function ClientForm({ client, onClose, onSuccess }: ClientFormProps): JSX.Element {
  const [formData, setFormData] = useState<ClientFormState>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    id_number: '',
    club_provider: null,
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const addressInputRef = useRef<HTMLInputElement>(null)
  const hasScriptLoaded = useRef(false)
  
  useEffect(() => {
    // Initialize form data based on whether we're editing or creating
    setFormData({
      first_name: client?.first_name || '',
      last_name: client?.last_name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      address: client?.address || '',
      city: client?.city || '',
      state: client?.state || '',
      postal_code: client?.postal_code || '',
      id_number: client?.id_number || '',
      club_provider: client?.club_provider || null,
      username: client?.username || '',
      password: client?.password || ''
    })
  }, [client])

  useEffect(() => {
    if (window.google?.maps?.places) {
      initAutocomplete()
      return
    }

    // Prevent multiple loading attempts
    if (hasScriptLoaded.current) return
    hasScriptLoaded.current = true

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCWBibqdDMv9SsTXzOISBOQ6tpY59ZQpnE&libraries=places&callback=initAutocomplete`
    script.async = true
    script.defer = true
    script.onerror = (): void => {
      console.error('Google Maps script failed to load')
      hasScriptLoaded.current = false
    }

    // Single global callback setup
    if (!window.initAutocomplete) {
      window.initAutocomplete = (): void => {
        if (window.google?.maps?.places) {
          initAutocomplete()
        }
      }
    }

    // Cleanup existing scripts more aggressively
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]')
    existingScripts.forEach(script => script.remove())

    document.head.appendChild(script)

    return (): void => {
      hasScriptLoaded.current = false
      delete window.initAutocomplete
      const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]')
      scripts.forEach(script => script.remove())
    }
  }, [])

  const initAutocomplete = (): void => {
    if (!addressInputRef.current || !window.google?.maps?.places) return

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'ZA' },
        fields: ['address_components', 'formatted_address', 'geometry']
      })

      // Prevent form submission on enter key
      addressInputRef.current.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') e.preventDefault();
      });

      // Ensure the input is not readonly
      addressInputRef.current.setAttribute('autocomplete', 'off');

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (!place.address_components) return

        // Extract address components
        let city = ''
        let state = ''
        let postalCode = ''
        
        place.address_components.forEach((component) => {
          const types = component.types

          if (types.includes('locality')) {
            city = component.long_name
          }
          if (types.includes('administrative_area_level_1')) {
            state = component.long_name
          }
          if (types.includes('postal_code')) {
            postalCode = component.long_name
          }
        })

        setFormData(prev => ({
          ...prev,
          address: place.formatted_address || '',
          city: city,
          state: state,
          postal_code: postalCode
        }))
      })
    } catch (error) {
      console.error('Error initializing Google Maps Autocomplete:', error)
    }
  }

  // Debounced validation
  const validateFormDebounced = useCallback(debounce(() => {
    validateForm()
  }, 300), [formData])

  useEffect(() => {
    validateFormDebounced()
    return (): void => validateFormDebounced.cancel()
  }, [formData, validateFormDebounced])

  // Optimized input handler
  const handleInputChange = useCallback((field: keyof ClientFormState) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
      setFormData(prev => ({
        ...prev,
        [field]: e.target.value
      }))
    }, [])

  // Enhanced validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    // Only validate if field has value
    if (formData.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.phone && !/^(\+27|0)[6-8][0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid South African phone number'
    }

    if (formData.id_number && !validateSouthAfricanID(formData.id_number)) {
      newErrors.id_number = 'Please enter a valid South African ID number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Luhn check for SA ID
  const validateSouthAfricanID = (id: string): boolean => {
    if (!/^\d{13}$/.test(id)) return false
    // ... implement Luhn check logic ...
    return true
  }

  const handleClose = useCallback((): void => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      id_number: '',
      club_provider: null,
      username: '',
      password: ''
    })
    setError(null)
    setErrors({})
    onClose()
  }, [onClose]);

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    setErrors({})

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Check for duplicates before proceeding
      const noDuplicates = await checkForDuplicates()
      if (!noDuplicates) {
        setLoading(false)
        return
      }

      if (client?.id) {
        // Update existing client
        const { error } = await getSupabase()
          .from('clients')
          .update(formData)
          .eq('id', client.id)
        if (error) throw error
      } else {
        // Add new client
        const { error } = await getSupabase()
          .from('clients')
          .insert([formData])
        if (error) throw error
      }
      onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [client, formData, onClose, onSuccess]);

  const checkForDuplicates = async (): Promise<boolean> => {
    // Skip duplicate check when editing existing client
    if (client?.id) return true;

    try {
      // Check for duplicate email
      const { data: emailData, error: emailError } = await getSupabase()
        .from('clients')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle()

      if (emailError) throw emailError;
      if (emailData) {
        setErrors(prev => ({
          ...prev,
          email: 'This email is already registered'
        }))
        return false;
      }

      // Check for duplicate ID number
      const { data: idData, error: idError } = await getSupabase()
        .from('clients')
        .select('id')
        .eq('id_number', formData.id_number)
        .maybeSingle()

      if (idError) throw idError;
      if (idData) {
        setErrors(prev => ({
          ...prev,
          id_number: 'This ID number is already registered'
        }))
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error checking for duplicates')
      return false;
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl p-8 w-full max-w-4xl border border-stone-700/30 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">
          {client ? 'Edit Client' : 'Add New Client'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                First Name <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={handleInputChange('first_name')}
                className={`w-full px-4 py-3 rounded-lg bg-stone-700/50 border ${
                  errors.first_name ? 'border-red-500' : 'border-stone-600/50'
                } text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all`}
                required
              />
              {errors.first_name && (
                <p className="text-red-400 text-xs mt-1">{errors.first_name}</p>
              )}
            </div>
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Last Name <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={handleInputChange('last_name')}
                className={`w-full px-4 py-3 rounded-lg bg-stone-700/50 border ${
                  errors.last_name ? 'border-red-500' : 'border-stone-600/50'
                } text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all`}
                required
              />
              {errors.last_name && (
                <p className="text-red-400 text-xs mt-1">{errors.last_name}</p>
              )}
            </div>
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Email <span className="text-orange-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                className={`w-full px-4 py-3 rounded-lg bg-stone-700/50 border ${
                  errors.email ? 'border-red-500' : 'border-stone-600/50'
                } text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all`}
                required
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Phone <span className="text-orange-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                className={`w-full px-4 py-3 rounded-lg bg-stone-700/50 border ${
                  errors.phone ? 'border-red-500' : 'border-stone-600/50'
                } text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all`}
                required
              />
              {errors.phone && (
                <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-stone-300 mb-1 text-sm">
                Address <span className="text-stone-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                ref={addressInputRef}
                value={formData.address}
                onChange={handleInputChange('address')}
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                placeholder="Start typing to search..."
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                City <span className="text-stone-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={handleInputChange('city')}
                className={`w-full px-4 py-3 rounded-lg bg-stone-700/50 border ${
                  errors.city ? 'border-red-500' : 'border-stone-600/50'
                } text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all`}
              />
              {errors.city && (
                <p className="text-red-400 text-xs mt-1">{errors.city}</p>
              )}
            </div>
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Province <span className="text-stone-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={handleInputChange('state')}
                className={`w-full px-4 py-3 rounded-lg bg-stone-700/50 border ${
                  errors.state ? 'border-red-500' : 'border-stone-600/50'
                } text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all`}
              />
              {errors.state && (
                <p className="text-red-400 text-xs mt-1">{errors.state}</p>
              )}
            </div>
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Postal Code <span className="text-stone-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={handleInputChange('postal_code')}
                className={`w-full px-4 py-3 rounded-lg bg-stone-700/50 border ${
                  errors.postal_code ? 'border-red-500' : 'border-stone-600/50'
                } text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all`}
              />
              {errors.postal_code && (
                <p className="text-red-400 text-xs mt-1">{errors.postal_code}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-stone-300 mb-1 text-sm">
              ID Number <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              value={formData.id_number}
              onChange={handleInputChange('id_number')}
              className={`w-full px-4 py-3 rounded-lg bg-stone-700/50 border ${
                errors.id_number ? 'border-red-500' : 'border-stone-600/50'
              } text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all`}
              required
            />
            {errors.id_number && (
              <p className="text-red-400 text-xs mt-1">{errors.id_number}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Club Provider <span className="text-stone-400 text-xs">(Optional)</span>
              </label>
              <select
                value={formData.club_provider || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  club_provider: e.target.value as 'PHASA' | 'NATSHOOT' | null
                }))}
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              >
                <option value="">Select club provider</option>
                <option value="PHASA">PHASA</option>
                <option value="NATSHOOT">NATSHOOT</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Username <span className="text-stone-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={handleInputChange('username')}
                className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-stone-300 mb-1 text-sm">
                Password <span className="text-stone-400 text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector('input[type="password"]') as HTMLInputElement;
                    if (input) {
                      input.type = 'text';
                      setTimeout(() => {
                        input.type = 'password';
                      }, 5000);
                    }
                  }}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-stone-400 hover:text-stone-200 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
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
              onClick={handleClose}
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
}) 