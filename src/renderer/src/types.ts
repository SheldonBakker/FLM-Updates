/* eslint-disable prettier/prettier */
export interface License {
  id: string
  client_id: string
  make: string
  model: string
  type: string
  caliber: string
  serial_number: string
  section: string
  expiry_date: string
  barrel_serial?: string
  barrel_make?: string
  receiver_serial?: string
  receiver_make?: string
  frame_serial?: string
  frame_make?: string
  last_notification_date?: string
  firearm_type: string
  license_number: string
  issue_date: string
  stock_code: string
  lic_number?: string
  client?: Client
}

export interface Client {
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
  gun_licences: License[]
  created_at: string
  updated_at: string
}

export interface Pagination {
  page: number
  perPage: number
}

export interface PaginatedClients {
  clients: Client[]
  total: number
} 