export interface SearchClient {
  id: string
  client_name: string
  email: string | null
}

export interface SearchInvoice {
  id: string
  invoice_number: string
  status: string
  amount: number
  client_id: string
  clients: { client_name: string }[] | { client_name: string } | null
}

export interface SearchResults {
  clients: SearchClient[]
  invoices: SearchInvoice[]
}
