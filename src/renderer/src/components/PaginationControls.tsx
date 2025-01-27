/* eslint-disable prettier/prettier */
import { memo } from 'react'
import { DashboardIcons } from './icons/DashboardIcons'
import { PaginatedClients, Pagination } from '../types'

interface PaginationControlsProps {
  pagination: Pagination
  paginatedClients: PaginatedClients
  setPagination: (pagination: Pagination) => void
}

function PaginationControls({ 
  pagination, 
  paginatedClients, 
  setPagination 
}: PaginationControlsProps): JSX.Element {
  return (
    <div className="flex justify-between items-center py-4">
      <button
        onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
        disabled={pagination.page === 1}
        className="p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-700 rounded-lg transition-colors"
      >
        <DashboardIcons.PrevPage className="w-5 h-5 text-white" />
      </button>
      
      <span className="text-white">
        Page {pagination.page} of {Math.ceil(paginatedClients.total / pagination.perPage)}
      </span>
      
      <button
        onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
        disabled={pagination.page >= Math.ceil(paginatedClients.total / pagination.perPage)}
        className="p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-700 rounded-lg transition-colors"
      >
        <DashboardIcons.NextPage className="w-5 h-5 text-white" />
      </button>
    </div>
  )
}

export default memo(PaginationControls) 