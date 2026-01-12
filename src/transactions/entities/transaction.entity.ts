export class Transaction {
  id: string;
  id_transaction: string;
  transaction_type: string;
  transaction_status: string;
  gateway_transaction_id: string;
  mid_id: string;
  payment_solution: string;
  payment_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  request_payment_date: string | null;
  currency: string;
  amount: number;
  payment_type: string;
  id_order: string;
  gateway_order_id: string;
  country: string;
  postal_code: string;
  card_type: string;
  card_sub_brand: string;
  is_test: string;
  customer_id: string;
  subscription_id: string;
  webhook_id: string | null;
  retry: number;
  id_payment: string;
  recurrence_cycle: number;
  user_agent_id: string | null;
  invoice_number?: string;
  gateway_id: string;
}

export class PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
