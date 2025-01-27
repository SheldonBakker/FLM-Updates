/* eslint-disable prettier/prettier */
import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react'
import { getSupabase, initializeSupabase } from '../lib/supabase'
import { debounce } from 'lodash'
import { Client, License } from '../types'
import { DashboardIcons } from './icons/DashboardIcons'

// Lazy load components
const ClientForm = lazy(() => import('./ClientForm'))
const LicenseForm = lazy(() => import('./LicenseForm'))
const ClientCard = lazy(() => import('./ClientCard'))

interface FormState {
  type: 'client' | 'license' | null
  isOpen: boolean
  selectedClient: Client | null
  selectedLicense: License | null
  selectedClientId: string | null
}

function Dashboard(): JSX.Element {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [licenseSearchQuery, setLicenseSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [perPage] = useState(5)
  const [formState, setFormState] = useState<FormState>({
    type: null,
    isOpen: false,
    selectedClient: null,
    selectedLicense: null,
    selectedClientId: null
  })

  const debouncedFetch = useCallback(
    debounce(async (clientTerm: string) => {
      try {
        await initializeSupabase();
        let query = getSupabase()
          .from('clients')
          .select('*, gun_licences(*)', { count: 'exact' })
          .order('last_name', { ascending: true });

        if (clientTerm) {
          const terms = clientTerm.trim().split(' ');
          if (terms.length > 1) {
            query = query.ilike('first_name', `${terms[0]}%`)
              .ilike('last_name', `${terms[1]}%`);
          } else {
            query = query.or(
              `first_name.ilike.${clientTerm}%,last_name.ilike.${clientTerm}%,email.ilike.%${clientTerm}%,id_number.ilike.%${clientTerm}%`
            );
          }
        }

        const { data, error } = await query;
        if (error) throw error;
        setClients(data || []);
        setPage(1);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  )

  useEffect(() => {
    debouncedFetch(clientSearchQuery)
    return (): void => debouncedFetch.cancel()
  }, [clientSearchQuery, debouncedFetch])

  const paginatedClients = useMemo(() => {
    const lastIndex = page * perPage
    const firstIndex = lastIndex - perPage
    
    return {
      clients: clients.slice(firstIndex, lastIndex),
      total: clients.length
    }
  }, [clients, page, perPage])

  const handleDeleteLicense = async (licenseId: string): Promise<void> => {
    try {
      const { error } = await getSupabase()
        .from('gun_licences')
        .delete()
        .eq('id', licenseId);

      if (error) throw error;
      
      debouncedFetch(clientSearchQuery);
    } catch (error) {
      console.error('Error deleting license:', error);
    }
  };

  const resetFormState = (): void => {
    setFormState({
      type: null,
      isOpen: false,
      selectedClient: null,
      selectedLicense: null,
      selectedClientId: null
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 to-stone-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Client Management</h1>
          <div className="flex gap-3">
            <button 
              onClick={() => setFormState({ ...formState, type: 'client', isOpen: true })}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 
                text-white px-4 py-2 rounded-lg shadow-xl shadow-orange-500/20 
                transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                flex items-center gap-2"
            >
              <DashboardIcons.Add className="w-4 h-4" />
              Add New Client
            </button>
            <button 
              onClick={() => debouncedFetch(clientSearchQuery)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 
                text-white px-4 py-2 rounded-lg shadow-xl shadow-orange-500/20 
                transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                flex items-center gap-2"
            >
              <DashboardIcons.Refresh className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Search Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search clients by name, email, ID number..."
              value={clientSearchQuery}
              onChange={(e) => setClientSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 
                text-white placeholder-stone-400 focus:outline-none focus:ring-2 
                focus:ring-orange-500/50 focus:border-transparent transition-all"
            />
            <DashboardIcons.Search className="absolute right-3 top-3.5 h-5 w-5 text-stone-400" />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search by license serial number..."
              value={licenseSearchQuery}
              onChange={(e) => setLicenseSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-stone-700/50 border border-stone-600/50 
                text-white placeholder-stone-400 focus:outline-none focus:ring-2 
                focus:ring-orange-500/50 focus:border-transparent transition-all"
            />
            <DashboardIcons.Search className="absolute right-3 top-3.5 h-5 w-5 text-stone-400" />
          </div>
        </div>

        {/* Client Cards */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
          </div>
        ) : clientSearchQuery || licenseSearchQuery ? (
          <div className="space-y-4">
            {paginatedClients.clients.map((client) => (
              <Suspense 
                key={client.id} 
                fallback={<div className="h-32 bg-stone-800/30 rounded-lg animate-pulse" />}
              >
                <ClientCard
                  client={client}
                  onEditClient={(client) => setFormState({
                    type: 'client',
                    isOpen: true,
                    selectedClient: client,
                    selectedLicense: null,
                    selectedClientId: null
                  })}
                  onAddLicense={(clientId) => setFormState({
                    type: 'license',
                    isOpen: true,
                    selectedClient: null,
                    selectedLicense: null,
                    selectedClientId: clientId
                  })}
                  onEditLicense={(license, clientId) => setFormState({
                    type: 'license',
                    isOpen: true,
                    selectedClient: null,
                    selectedLicense: license,
                    selectedClientId: clientId
                  })}
                  onDeleteLicense={(licenseId) => handleDeleteLicense(licenseId)}
                />
              </Suspense>
            ))}
            {paginatedClients.clients.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                <DashboardIcons.Search className="w-12 h-12 mb-4" />
                <p className="text-lg">No results found for &quot;{clientSearchQuery} {licenseSearchQuery}&quot;</p>
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-between items-center py-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-700 
                  rounded-lg transition-colors"
              >
                <DashboardIcons.PrevPage className="w-5 h-5 text-white" />
              </button>
              
              <span className="text-white">
                Page {page} of {Math.ceil(paginatedClients.total / perPage)}
              </span>
              
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(paginatedClients.total / perPage)}
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
            <p className="text-lg">Enter a search term to find clients</p>
          </div>
        )}

        {/* Forms */}
        <Suspense fallback={null}>
          {formState.isOpen && formState.type === 'client' && (
            <ClientForm
              client={formState.selectedClient}
              onClose={() => resetFormState()}
              onSuccess={() => {
                debouncedFetch(clientSearchQuery)
                resetFormState()
              }}
            />
          )}

          {formState.isOpen && formState.type === 'license' && (
            <LicenseForm
              license={formState.selectedLicense}
              clientId={formState.selectedClientId!}
              onClose={() => resetFormState()}
              onSuccess={() => {
                debouncedFetch(clientSearchQuery)
                resetFormState()
              }}
            />
          )}
        </Suspense>
      </div>
    </div>
  )
}

export default Dashboard