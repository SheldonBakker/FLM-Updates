/* eslint-disable prettier/prettier */
import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react'
import { getSupabase, initializeSupabase } from '../lib/supabase'
import { debounce } from 'lodash'
import { Client, License } from '../types'
import { DashboardIcons } from '../components/icons/DashboardIcons'
import SearchBar from '../components/SearchBar'

// Lazy load components
const ClientForm = lazy(() => import('../components/Client/ClientForm'))
const LicenseForm = lazy(() => import('../components/Client/LicenseForm'))
const ClientCard = lazy(() => import('../components/ClientCard'))

interface FormState {
  type: 'client' | 'license' | null
  isOpen: boolean
  selectedClient: Client | null
  selectedLicense: License | null
  selectedClientId: string | null
}

function Dashboard(): React.JSX.Element {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [perPage] = useState(5)
  const [formState, setFormState] = useState<FormState>({
    type: null,
    isOpen: false,
    selectedClient: null,
    selectedLicense: null,
    selectedClientId: null
  })
  const [totalClients, setTotalClients] = useState<number>(0)
  const [cachedTotalClients, setCachedTotalClients] = useState<number>(0)
  const [needsRefresh] = useState(false)

  const debouncedFetch = useMemo(() => 
    debounce(async (clientTerm: string) => {
      try {
        setLoading(true);
        await initializeSupabase();
        let query = getSupabase()
          .from('clients')
          .select('*, gun_licences(*)', { count: 'exact' })
          .order('last_name', { ascending: true });

        // Only add search conditions if there's a term
        if (clientTerm) {
          const conditions: string[] = [];
          const trimmedTerm = clientTerm.trim();
          const terms = trimmedTerm.split(' ').filter(t => t.length > 0);
          
          if (trimmedTerm.includes('@')) {
            conditions.push(`email.ilike.%${trimmedTerm}%`);
          }
          else if (/^\d+$/.test(trimmedTerm)) {
            conditions.push(`id_number.eq.${trimmedTerm}`);
          } else if (terms.length > 1) {
            const firstName = terms.slice(0, -1).join(' ');
            const lastName = terms[terms.length - 1];
            conditions.push(
              `and(first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%)`
            );
          } else {
            conditions.push(
              `or(first_name.ilike.%${trimmedTerm}%,last_name.ilike.%${trimmedTerm}%)`
            );
          }

          if (conditions.length > 0) {
            query = query.or(conditions.join(','));
          }
        }

        const { data, error, count } = await query;
        if (error) throw error;
        
        setClients(data || []);
        setTotalClients(count || 0);
        // Update cache only when fetching all records
        if (!clientTerm) {
          setCachedTotalClients(count || 0);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    }, 400),
    []
  );

  useEffect(() => {
    // Initial fetch when component mounts
    const fetchInitialData = async (): Promise<void> => {
      try {
        setLoading(true);
        await initializeSupabase();
        const { data, count } = await getSupabase()
          .from('clients')
          .select('*, gun_licences(*)', { count: 'exact' })
          .order('last_name', { ascending: true });

        setClients(data || []);
        setTotalClients(count || 0);
        setCachedTotalClients(count || 0); // Initialize cache
      } catch (error) {
        console.error('Error fetching initial client data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    // Only search if there's a query or we need to refresh
    if (clientSearchQuery || needsRefresh) {
      setClients([]);
      debouncedFetch(clientSearchQuery);
    }
    return (): void => debouncedFetch.cancel();
  }, [clientSearchQuery, debouncedFetch, needsRefresh]);

  const paginatedClients = useMemo(() => {
    const lastIndex = page * perPage
    const firstIndex = lastIndex - perPage
    
    return {
      clients: clients.slice(firstIndex, lastIndex),
      total: clients.length
    }
  }, [clients, page, perPage])

  const handleDeleteLicense = useCallback(async (licenseId: string): Promise<void> => {
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
  }, [debouncedFetch, clientSearchQuery]);

  const handleDeleteClient = useCallback(async (clientId: string): Promise<void> => {
    try {
      const { error } = await getSupabase()
        .from('clients')
        .delete()
        .eq('id', clientId);
      if (error) throw error;
      debouncedFetch(clientSearchQuery);
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  }, [debouncedFetch, clientSearchQuery]);

  const resetFormState = useCallback((): void => {
    setFormState({
      type: null,
      isOpen: false,
      selectedClient: null,
      selectedLicense: null,
      selectedClientId: null
    })
  }, []);

  const formHandlers = useMemo<{
    onEditClient: (client: Client) => void
    onAddLicense: (clientId: string) => void
    onEditLicense: (license: License, clientId: string) => void
  }>(() => ({
    onEditClient: (client: Client): void => setFormState({
      type: 'client',
      isOpen: true,
      selectedClient: client,
      selectedLicense: null,
      selectedClientId: null
    }),
    onAddLicense: (clientId: string): void => setFormState({
      type: 'license',
      isOpen: true,
      selectedClient: null,
      selectedLicense: null,
      selectedClientId: clientId
    }),
    onEditLicense: (license: License, clientId: string): void => setFormState({
      type: 'license',
      isOpen: true,
      selectedClient: null,
      selectedLicense: license,
      selectedClientId: clientId
    })
  }), []);

  const handleSearch = (query: string): void => {
    const trimmedQuery = query.trim();
    
    // Clear search and show all records
    if (!trimmedQuery) {
      setClientSearchQuery('');
      setClients([]); // Clear current results
      setTotalClients(cachedTotalClients); // Use cached value
      return;
    }

    // Don't search if query is too short
    if (trimmedQuery.length < 2) {
      return;
    }

    // Don't search if query hasn't changed
    if (trimmedQuery === clientSearchQuery) {
      return;
    }

    setClientSearchQuery(trimmedQuery);
    debouncedFetch(trimmedQuery);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 to-stone-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Client Management</h1>
            <div className="px-3 py-1 bg-stone-700/50 rounded-full text-sm text-stone-300">
              Total Records: {totalClients}
            </div>
          </div>
          
          <SearchBar 
            onSearch={handleSearch} 
            isLoading={loading} 
          />

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
                flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              <DashboardIcons.Refresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Search Results Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
            <p className="mt-4 text-stone-400">Searching clients...</p>
          </div>
        ) : clientSearchQuery ? (
          <div className="space-y-4">
            {paginatedClients.clients.length > 0 ? (
              <>
                <div className="text-stone-400">
                  Showing {paginatedClients.clients.length} of {totalClients} results for &quot;{clientSearchQuery}&quot;
                </div>

                {paginatedClients.clients.map((client) => (
                  <Suspense 
                    key={client.id} 
                    fallback={<div className="h-32 bg-stone-800/30 rounded-lg animate-pulse" />}
                  >
                    <ClientCard
                      client={client}
                      onEditClient={formHandlers.onEditClient}
                      onAddLicense={formHandlers.onAddLicense}
                      onEditLicense={formHandlers.onEditLicense}
                      onDeleteLicense={handleDeleteLicense}
                      onDeleteClient={handleDeleteClient}
                    />
                  </Suspense>
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                <DashboardIcons.Search className="w-12 h-12 mb-4" />
                <p className="text-lg">No results found for &quot;{clientSearchQuery}&quot;</p>
                <p className="text-sm mt-2">Try searching by name, ID, or email</p>
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
            <p className="text-lg">Start typing to search for clients</p>
            <p className="text-sm mt-2">Search by name, ID, or email</p>
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