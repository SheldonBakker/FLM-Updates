/* eslint-disable prettier/prettier */
import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { getSupabase } from '../lib/supabase'
import { License, Client } from '../types'
import { DashboardIcons } from '../components/icons/DashboardIcons'
import LicenseForm from '../components/LicenseForm'
import { Dialog } from './Dialog'

interface FormState {
  type: 'license' | null
  isOpen: boolean
  selectedLicense: License | null
  selectedClientId: string | null
}

function LicensesPage(): JSX.Element {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [perPage] = useState(5)
  const [formState, setFormState] = useState<FormState>({
    type: null,
    isOpen: false,
    selectedLicense: null,
    selectedClientId: null
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    licenseId: string | null
  }>({
    isOpen: false,
    licenseId: null
  })

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const fetchLicenses = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const { data, error } = await getSupabase()
        .from('gun_licences')
        .select(`
          id,
          make,
          type,
          caliber,
          serial_number,
          section,
          expiry_date,
          stock_code,
          lic_number,
          issue_date,
          clients:client_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            id_number,
            address,
            city,
            state,
            postal_code
          )
        `)
        .order('expiry_date', { ascending: true })

      if (error) throw error
      const transformedData = data?.map(license => ({
        ...license,
        client_id: (license.clients as unknown as Client)?.id,
        client: license.clients as unknown as Client,
        license_number: license.lic_number,
        issue_date: license.issue_date,
        expiry_date: license.expiry_date,
        firearm_type: license.type,
        caliber: license.caliber || '',
        section: license.section || ''
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

  const handleDeleteLicense = useCallback(async (licenseId: string): Promise<void> => {
    try {
      const { error } = await getSupabase()
        .from('gun_licences')
        .delete()
        .eq('id', licenseId);

      if (error) throw error;
      
      fetchLicenses();
    } catch (error) {
      console.error('Error deleting license:', error);
    } finally {
      setDeleteDialog({ isOpen: false, licenseId: null });
    }
  }, [fetchLicenses]);

  const resetFormState = useCallback((): void => {
    setFormState({
      type: null,
      isOpen: false,
      selectedLicense: null,
      selectedClientId: null
    });
  }, []);

  const formHandlers = useMemo(() => ({
    onEditLicense: (license: License, clientId: string): void => setFormState({
      type: 'license',
      isOpen: true,
      selectedLicense: license,
      selectedClientId: clientId
    })
  }), []);

  useEffect(() => {
    fetchLicenses()
  }, [fetchLicenses])

  const filteredLicenses = useMemo(() => {
    const searchTerm = debouncedSearchQuery.toLowerCase()
    return licenses.filter((license) => {
      return (
        debouncedSearchQuery &&
        license.serial_number?.toLowerCase().includes(searchTerm)
      )
    })
  }, [licenses, debouncedSearchQuery])

  const { items: visibleLicenses, total } = useVirtualization(
    filteredLicenses,
    page,
    perPage
  )

  const totalPages = useMemo(() => 
    Math.ceil(total / perPage), 
    [total, perPage]
  )

  const formatDate = useCallback((dateString: string) => 
    new Date(dateString).toLocaleDateString(), 
    []
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 to-stone-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Gun Licenses</h1>
            <div className="px-3 py-1 bg-stone-700/50 rounded-full text-sm text-stone-300">
              Total Records: {licenses.length}
            </div>
          </div>

          <div className="relative flex-1 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Serial Number..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full px-4 py-2 bg-stone-700 text-white rounded-lg focus:outline-none 
                  focus:ring-2 focus:ring-orange-500 pr-10"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {loading ? (
                  <DashboardIcons.Refresh className="w-5 h-5 text-orange-500 animate-spin" />
                ) : (
                  <DashboardIcons.Search className="w-5 h-5 text-stone-400" />
                )}
              </div>
            </div>
            {searchQuery && (
              <div className="absolute mt-1 text-sm text-stone-400">
                Tip: Search by serial number
              </div>
            )}
          </div>

          <button 
            onClick={fetchLicenses}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 
              text-white px-4 py-2 rounded-lg shadow-xl shadow-orange-500/20 
              transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
              flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={loading}
          >
            <DashboardIcons.Refresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
            <p className="mt-4 text-stone-400">Searching licenses...</p>
          </div>
        ) : debouncedSearchQuery ? (
          <div className="space-y-4">
            {visibleLicenses.length > 0 ? (
              <>
                <div className="text-stone-400">
                  Showing {visibleLicenses.length} of {total} results for &quot;{debouncedSearchQuery}&quot;
                </div>

                {visibleLicenses.map((license) => {
                  const client = license.client as Client
                  return (
                    <div key={license.id} className="bg-stone-700/60 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-orange-500/20 relative">
                      <div className="absolute right-6 top-6">
                        <button
                          onClick={() => formHandlers.onEditLicense(license, license.client_id)}
                          className="p-2 hover:bg-stone-600/50 rounded-lg transition-colors"
                          title="Edit License"
                        >
                          <DashboardIcons.Edit className="w-5 h-5 text-orange-400" />
                        </button>
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold text-white">License Details</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 text-stone-300">
                          <p><span className="text-orange-400">Make & Model:</span> {license.make}</p>
                          <p><span className="text-orange-400">Type:</span> {license.type}</p>
                          <p><span className="text-orange-400">Caliber:</span> {license.caliber}</p>
                          <p><span className="text-orange-400">Section:</span> {license.section}</p>
                          <p><span className="text-orange-400">Serial Number:</span> {license.serial_number}</p>
                          <p><span className="text-orange-400">License Number:</span> {license.lic_number}</p>
                          <p><span className="text-orange-400">Stock Code:</span> {license.stock_code}</p>
                          <p><span className="text-orange-400">Issue Date:</span> {formatDate(license.issue_date)}</p>
                          <p><span className="text-orange-400">Expiry Date:</span> {formatDate(license.expiry_date)}</p>
                        </div>
                        <div className="space-y-2 text-stone-300">
                          <p><span className="text-orange-400">Name:</span> {client?.first_name} {client?.last_name}</p>
                          <p><span className="text-orange-400">Email:</span> {client?.email}</p>
                          <p><span className="text-orange-400">Phone:</span> {client?.phone}</p>
                          <p><span className="text-orange-400">ID:</span> {client?.id_number}</p>
                          <p><span className="text-orange-400">Address:</span> {client?.address}</p>
                          <div className="grid grid-cols-3 gap-2">
                            <p><span className="text-orange-400">City:</span> {client?.city}</p>
                            <p><span className="text-orange-400">Province:</span> {client?.state}</p>
                            <p><span className="text-orange-400">Postal Code:</span> {client?.postal_code}</p>
                          </div>
                        </div>
                      </div>
                      <div className="absolute right-6 bottom-6">
                        <button
                          onClick={() => setDeleteDialog({ isOpen: true, licenseId: license.id })}
                          className="p-2 hover:bg-stone-600/50 rounded-lg transition-colors"
                          title="Delete License"
                        >
                          <DashboardIcons.Delete className="w-5 h-5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                <DashboardIcons.Search className="w-12 h-12 mb-4" />
                <p className="text-lg">No results found for &quot;{debouncedSearchQuery}&quot;</p>
              </div>
            )}

            <div className="flex justify-between items-center py-4">
              <button
                onClick={() => handlePageChange('prev')}
                disabled={page === 1}
                className="p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-700 
                  rounded-lg transition-colors"
              >
                <DashboardIcons.PrevPage className="w-5 h-5 text-white" />
              </button>
              
              <span className="text-white">
                Page {page} of {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange('next')}
                disabled={page >= totalPages}
                className="p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-700 
                  rounded-lg transition-colors"
              >
                <DashboardIcons.NextPage className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-stone-400">
            <DashboardIcons.Search className="w-12 h-12 mb-4" />
            <p className="text-lg">Start typing to search for licenses</p>
          </div>
        )}

        {/* License Form */}
        <Suspense fallback={null}>
          {formState.isOpen && formState.type === 'license' && (
            <LicenseForm
              license={formState.selectedLicense}
              clientId={formState.selectedClientId!}
              onClose={resetFormState}
              onSuccess={() => {
                fetchLicenses();
                resetFormState();
              }}
            />
          )}
        </Suspense>
      </div>

      <Dialog
        isOpen={deleteDialog.isOpen}
        title="Confirm Delete"
        message="Are you sure you want to delete this license? This action cannot be undone."
        onConfirm={() => deleteDialog.licenseId && handleDeleteLicense(deleteDialog.licenseId)}
        onCancel={() => setDeleteDialog({ isOpen: false, licenseId: null })}
      />
    </div>
  )
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect((): (() => void) => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return (): void => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function useVirtualization<T>(
  items: T[],
  page: number,
  perPage: number
): { items: T[]; total: number } {
  return useMemo(() => {
    const lastIndex = page * perPage;
    const firstIndex = lastIndex - perPage;
    return {
      items: items.slice(firstIndex, lastIndex),
      total: items.length,
    };
  }, [items, page, perPage]);
}

export default LicensesPage 