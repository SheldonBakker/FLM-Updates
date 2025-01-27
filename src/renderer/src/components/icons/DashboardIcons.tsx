/* eslint-disable prettier/prettier */
import { 
  FiEdit2, 
  FiPlus, 
  FiTrash2, 
  FiChevronLeft, 
  FiChevronRight,
  FiSearch,
  FiRefreshCw
} from 'react-icons/fi'

export const DashboardIcons = {
  Edit: FiEdit2,
  Add: FiPlus,
  Delete: FiTrash2,
  PrevPage: FiChevronLeft,
  NextPage: FiChevronRight,
  Search: FiSearch,
  Refresh: FiRefreshCw
} as const

export type DashboardIconType = keyof typeof DashboardIcons
export default DashboardIcons