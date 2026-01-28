export class Transaction {
  id: string;
  id_transaction: string;
  transaction_type: string;
  transaction_status: string;
  gateway_transaction_id?: string;
  mid_id?: string;
  payment_solution?: string;
  payment_date: string | null;
  created_at: string | null;
  updated_at?: string | null;
  request_payment_date?: string | null;
  currency: string;
  amount: number;
  payment_type: string;
  id_order?: string;
  gateway_order_id: string;
  country?: string | null;
  postal_code?: string;
  card_type?: string;
  card_sub_brand?: string;
  is_test: string;
  customer_id: string;
  subscription_id: string;
  webhook_id?: string | null;
  retry: number;
  id_payment?: string;
  recurrence_cycle: number;
  user_agent_id?: string | null;
  invoice_number?: string;
  gateway_id?: string;
  // Enriched fields from BaaS API
  email?: string | null;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  provider?: string | null;
  normalized_card_brand?: string | null;
  card_holder_name?: string | null;
  bin?: string | null;
  last_4?: string | null;
  next_transaction_date?: string | null;
  refund_date?: string | null;
  error_code?: string | null;
  error_message?: string | null;
}

export class PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
