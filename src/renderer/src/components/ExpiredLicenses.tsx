/* eslint-disable prettier/prettier */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { getSupabase } from '../lib/supabase'
import { RenewalForm } from './RenewalForm'
import { DashboardIcons } from './icons/DashboardIcons'

interface License {
  id: string
  make: string
  issues_date: string
  type: string
  caliber: string
  serial_number: string
  section: string
  expiry_date: string
  last_notification_date?: string | null
  toggle_notifications: boolean
  client: Client
  lic_number?: string
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
}

interface RenewalFormData {
  issue_date: string;
  expiry_date: string;
  lic_number: string;
  section: string;
}

function ExpiredLicenses(): JSX.Element {
  const [expiredLicenses, setExpiredLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notificationStatus, setNotificationStatus] = useState<{
    loading: boolean;
    error?: string;
    success?: string;
  }>({
    loading: false
  })
  const [showRenewalForm, setShowRenewalForm] = useState(false)
  const [selectedLicenseId, setSelectedLicenseId] = useState<string | null>(null)
  const [renewalFormData, setRenewalFormData] = useState<RenewalFormData>({
    issue_date: '',
    expiry_date: '',
    lic_number: '',
    section: ''
  })

  // Add debounced search state
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)

  // Update debounced value after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return (): void => clearTimeout(timer)
  }, [searchQuery])

  const fetchExpiredLicenses = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const today = new Date()
      const futureDate = new Date(today)
      futureDate.setDate(today.getDate() + 130)
      
      const { data, error } = await getSupabase()
        .from('gun_licences')
        .select(`
          *,
          client:clients(*)
        `)
        .lte('expiry_date', futureDate.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true })

      if (error) throw error
      if (data) setExpiredLicenses(data)
    } catch (error) {
      console.error('Error fetching licenses:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExpiredLicenses()
  }, [fetchExpiredLicenses])

  const [notificationFilter, setNotificationFilter] = useState<'all' | 'active' | 'paused'>('all')

  const filteredLicenses = useMemo(() => {
    return expiredLicenses.filter(license => {
      if (notificationFilter === 'all') return true
      if (notificationFilter === 'active') return license.toggle_notifications
      if (notificationFilter === 'paused') return !license.toggle_notifications
      return true
    })
  }, [expiredLicenses, notificationFilter])

  // Use debounced value for filtering
  const paginatedLicenses = useMemo(() => {
    const searchTerm = debouncedSearch.toLowerCase()
    const filtered = filteredLicenses.filter((license) => (
      (license.client.first_name?.toLowerCase() || '').includes(searchTerm) ||
      (license.client.last_name?.toLowerCase() || '').includes(searchTerm) ||
      (license.make?.toLowerCase() || '').includes(searchTerm) ||
      (license.issues_date?.toLowerCase() || '').includes(searchTerm) ||
      (license.serial_number?.toLowerCase() || '').includes(searchTerm)
    ))

    const lastIndex = currentPage * itemsPerPage
    const firstIndex = lastIndex - itemsPerPage

    return {
      licenses: filtered.slice(firstIndex, lastIndex),
      totalPages: Math.ceil(filtered.length / itemsPerPage),
      totalLicenses: filtered.length
    }
  }, [filteredLicenses, debouncedSearch, currentPage, itemsPerPage])

  const PaginationControls = (): JSX.Element => (
    <div className="mt-6 flex items-center justify-between border-t border-stone-600/30 pt-4">
      <div className="text-sm text-stone-400">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, paginatedLicenses.totalLicenses)} of {paginatedLicenses.totalLicenses} expired licenses
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-lg bg-stone-700/50 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-600/50 transition-colors"
        >
          Previous
        </button>
        {[...Array(paginatedLicenses.totalPages)].map((_, idx) => (
          <button
            key={idx + 1}
            onClick={() => setCurrentPage(idx + 1)}
            className={`px-3 py-1 rounded-lg transition-colors ${
              currentPage === idx + 1
                ? 'bg-red-500 text-white'
                : 'bg-stone-700/50 text-white hover:bg-stone-600/50'
            }`}
          >
            {idx + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginatedLicenses.totalPages))}
          disabled={currentPage === paginatedLicenses.totalPages}
          className="px-3 py-1 rounded-lg bg-stone-700/50 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-600/50 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )

  const getLicenseStatus = (expiryDate: string): { color: string; text: string } => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return {
        color: 'text-red-500',
        text: `Expired ${Math.abs(daysUntilExpiry)} days ago`
      }
    } else {
      return {
        color: 'text-orange-500',
        text: `Expires in ${daysUntilExpiry} days`
      }
    }
  }

  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text)
  }

  const markAsNotified = async (licenseId: string): Promise<void> => {
    try {
      setNotificationStatus({ loading: true })
      const license = expiredLicenses.find(l => l.id === licenseId)
      if (!license) throw new Error('License not found')

      // Toggle the notifications state
      const newNotificationState = !license.toggle_notifications

      const { error: dbError } = await getSupabase()
        .from('gun_licences')
        .update({ toggle_notifications: newNotificationState })
        .eq('id', licenseId)

      if (dbError) throw dbError
      
      setNotificationStatus({
        loading: false,
        success: newNotificationState ? 'Notifications enabled' : 'Notifications paused'
      })

      // Clear success message after 3 seconds
      setTimeout(() => {
        setNotificationStatus({ loading: false })
      }, 3000)

      // Refresh the licenses list
      await fetchExpiredLicenses()
    } catch (error) {
      console.error('Error updating notifications:', error)
      setNotificationStatus({
        loading: false,
        error: error instanceof Error 
          ? error.message 
          : 'Failed to update notifications. Please try again.'
      })

      // Clear error message after 3 seconds
      setTimeout(() => {
        setNotificationStatus({ loading: false })
      }, 3000)
    }
  }

  const handleRefresh = async (): Promise<void> => {
    setIsRefreshing(true)
    await fetchExpiredLicenses()
    setIsRefreshing(false)
  }

  const handleRenewalSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!selectedLicenseId || !renewalFormData.expiry_date) return

    try {
      const { error } = await getSupabase()
        .from('gun_licences')
        .update({
          expiry_date: renewalFormData.expiry_date,
          lic_number: renewalFormData.lic_number,
          last_notification_date: null,
          toggle_notifications: true
        })
        .eq('id', selectedLicenseId)

      if (error) throw error

      // Only update local state after successful Supabase update
      setExpiredLicenses(prevLicenses => 
        prevLicenses.map(license => 
          license.id === selectedLicenseId
            ? {
                ...license,
                expiry_date: renewalFormData.expiry_date,
                lic_number: renewalFormData.lic_number,
                last_notification_date: null,
                toggle_notifications: true
              }
            : license
        )
      )

      clearAndCloseForm()
    } catch (error) {
      console.error('Error renewing license:', error)
    }
  }

  // Add new function to handle clearing and closing
  const clearAndCloseForm = (): void => {
    setShowRenewalForm(false)
    setSelectedLicenseId(null)
    setRenewalFormData({
      issue_date: '',
      expiry_date: '',
      lic_number: '',
      section: ''
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 to-stone-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Expiring Licences</h1>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setNotificationFilter('all')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    notificationFilter === 'all'
                      ? 'bg-red-500 text-white'
                      : 'bg-stone-700/50 text-white hover:bg-stone-600/50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setNotificationFilter('active')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    notificationFilter === 'active'
                      ? 'bg-green-500 text-white'
                      : 'bg-stone-700/50 text-white hover:bg-stone-600/50'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setNotificationFilter('paused')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    notificationFilter === 'paused'
                      ? 'bg-orange-500 text-white'
                      : 'bg-stone-700/50 text-white hover:bg-stone-600/50'
                  }`}
                >
                  Paused
                </button>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 
                text-white px-4 py-2 rounded-lg shadow-xl shadow-orange-500/20 
                transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <DashboardIcons.Refresh className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedLicenses.licenses.map((license) => {
              const status = getLicenseStatus(license.expiry_date)
              return (
                <div key={license.id} 
                  className={`bg-stone-700/60 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border ${
                    new Date(license.expiry_date) < new Date() 
                      ? 'border-red-500/20' 
                      : 'border-orange-500/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-white">License Details</h2>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className={`${status.color} text-sm font-medium`}>
                          {status.text}
                        </span>
                        {license.last_notification_date && (
                          <span className="text-sm text-stone-400">
                            Last notified: {new Date(license.last_notification_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLicenseId(license.id)
                          setShowRenewalForm(true)
                        }}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all duration-200"
                      >
                        Renew License
                      </button>
                      <button
                        onClick={() => markAsNotified(license.id)}
                        disabled={notificationStatus.loading}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                          ${notificationStatus.loading 
                            ? 'bg-stone-500/20 text-stone-400 cursor-not-allowed' 
                            : license.toggle_notifications
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                          }`}
                        title="Pause notifications"
                      >
                        {notificationStatus.loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></div>
                            Pausing...
                          </div>
                        ) : license.toggle_notifications ? (
                          'Notifications Active'
                        ) : (
                          'Notifications Paused'
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="space-y-2 text-stone-300">
                        <p>
                          <span className="text-orange-400">Issue Date:</span> {license.issues_date}
                        </p>
                        <p>
                          <span className="text-orange-400">Type:</span> {license.type}
                        </p>
                        <p>
                          <span className="text-orange-400">Caliber:</span> {license.caliber}
                        </p>
                        <p>
                          <span className="text-orange-400">Serial Number:</span> {license.serial_number}
                        </p>
                        <p>
                          <span className="text-orange-400">Section:</span> {license.section}
                        </p>
                        <p>
                          <span className="text-white">Expiry Date:</span>{' '}
                          <span className={status.color}>
                            {new Date(license.expiry_date).toISOString().split('T')[0]}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold text-white mb-4">Client Details</h2>
                      <div className="space-y-2 text-stone-300">
                        <p className="flex items-center gap-2">
                          <span className="text-orange-400">Name:</span>{' '}
                          {license.client.first_name} {license.client.last_name}
                          <button
                            onClick={() => copyToClipboard(`${license.client.first_name} ${license.client.last_name}`)}
                            className="hover:text-white transition-colors"
                            title="Copy name"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-orange-400">Email:</span> {license.client.email}
                          <button
                            onClick={() => copyToClipboard(license.client.email)}
                            className="hover:text-white transition-colors"
                            title="Copy email"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-orange-400">Phone:</span> {license.client.phone}
                          <button
                            onClick={() => copyToClipboard(license.client.phone)}
                            className="hover:text-white transition-colors"
                            title="Copy phone"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-orange-400">ID Number:</span> {license.client.id_number}
                          <button
                            onClick={() => copyToClipboard(license.client.id_number)}
                            className="hover:text-white transition-colors"
                            title="Copy ID number"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-orange-400">Address:</span> {license.client.address}
                          <button
                            onClick={() => copyToClipboard(license.client.address)}
                            className="hover:text-white transition-colors"
                            title="Copy address"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <PaginationControls />
          </div>
        )}

        {(notificationStatus.error || notificationStatus.success) && (
          <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg ${
            notificationStatus.error 
              ? 'bg-red-500/90 text-white' 
              : 'bg-green-500/90 text-white'
          }`}>
            {notificationStatus.error || notificationStatus.success}
          </div>
        )}

        {showRenewalForm && (
          <RenewalForm
            renewalFormData={renewalFormData}
            onRenewalSubmit={handleRenewalSubmit}
            onClose={clearAndCloseForm}
            onFormDataChange={setRenewalFormData}
          />
        )}
      </div>
    </div>
  )
}

export default ExpiredLicenses 