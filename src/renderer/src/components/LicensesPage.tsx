/* eslint-disable prettier/prettier */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { getSupabase } from '../lib/supabase'
import { License, Client } from '../types'
import { DashboardIcons } from '../components/icons/DashboardIcons'

function LicensesPage(): JSX.Element {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [perPage] = useState(5)

  const fetchLicenses = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const { data, error } = await getSupabase()
        .from('gun_licences')
        .select(`
          id,
          make,
          model,
          type,
          caliber,
          serial_number,
          section,
          expiry_date,
          stock_code,
          lic_number,
          clients:client_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            id_number
          )
        `)
        .order('expiry_date', { ascending: true })

      if (error) throw error
      const transformedData = data?.map(license => ({
        ...license,
        client_id: license.client_id,
        client: license.clients,
        license_number: license.lic_number,
        issue_date: license.expiry_date,
        firearm_type: license.type
      })) || []
      setLicenses(transformedData)
    } catch (error) {
      console.error('Error fetching licenses:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value)
    setPage(1) // Reset to first page on search
  }, [])

  const handlePageChange = useCallback((direction: 'prev' | 'next'): void => {
    setPage(p => direction === 'prev' ? Math.max(1, p - 1) : p + 1)
  }, [])

  useEffect(() => {
    fetchLicenses()
  }, [fetchLicenses])

  const paginatedLicenses = useMemo(() => {
    const searchTerm = searchQuery.toLowerCase()
    const filtered = licenses.filter((license) => {
      const client = license.client as Client
      return (
        (client.first_name?.toLowerCase() || '').includes(searchTerm) ||
        (client.last_name?.toLowerCase() || '').includes(searchTerm) ||
        (license.make?.toLowerCase() || '').includes(searchTerm) ||
        (license.model?.toLowerCase() || '').includes(searchTerm) ||
        (license.serial_number?.toLowerCase() || '').includes(searchTerm)
      )
    })

    const lastIndex = page * perPage
    const firstIndex = lastIndex - perPage

    return {
      licenses: filtered.slice(firstIndex, lastIndex),
      total: filtered.length
    }
  }, [licenses, searchQuery, page, perPage])

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 to-stone-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-white">Gun Licenses</h1>
          
          <div className="relative flex-1 max-w-2xl ml-4">
            <input
              type="text"
              placeholder="Search licenses by name, make, model, or serial..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 
                text-white placeholder-stone-400 focus:outline-none focus:ring-2 
                focus:ring-orange-500/50 focus:border-transparent transition-all"
            />
          </div>

          <button 
            onClick={fetchLicenses}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 
              text-white px-4 py-2 rounded-lg shadow-xl shadow-orange-500/20 
              transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
              flex items-center gap-2"
          >
            <DashboardIcons.Refresh className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedLicenses.licenses.map((license) => {
              const client = license.client as Client
              return (
                <div key={license.id} className="bg-stone-700/60 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-orange-500/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 text-stone-300">
                      <h2 className="text-xl font-semibold text-white mb-2">License Details</h2>
                      <p><span className="text-orange-400">Make:</span> {license.make}</p>
                      <p><span className="text-orange-400">Model:</span> {license.model}</p>
                      <p><span className="text-orange-400">Serial:</span> {license.serial_number}</p>
                      <p><span className="text-orange-400">Expiry:</span> {new Date(license.expiry_date).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-2 text-stone-300">
                      <h2 className="text-xl font-semibold text-white mb-2">Client Details</h2>
                      <p><span className="text-orange-400">Name:</span> {client.first_name} {client.last_name}</p>
                      <p><span className="text-orange-400">Email:</span> {client.email}</p>
                      <p><span className="text-orange-400">Phone:</span> {client.phone}</p>
                      <p><span className="text-orange-400">ID:</span> {client.id_number}</p>
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="flex justify-between items-center py-4">
              <button
                onClick={() => handlePageChange('prev')}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg bg-stone-700/50 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-600/50 transition-colors"
              >
                Previous
              </button>
              <span className="text-white">
                Page {page} of {Math.ceil(paginatedLicenses.total / perPage)}
              </span>
              <button
                onClick={() => handlePageChange('next')}
                disabled={page >= Math.ceil(paginatedLicenses.total / perPage)}
                className="px-3 py-1 rounded-lg bg-stone-700/50 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-600/50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LicensesPage 