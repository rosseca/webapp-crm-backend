export class User {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
  loginWith: string;
  company_name?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  vat_number?: string;
  country?: string;
  subscription_id?: string;
  language_communication?: string;
  language_registration?: string;
  created_at: string | null;
  updated_at: string | null;
  // New fields
  customer_id_np?: string;
  status?: string;
  unsubscribed_date?: string | null;
  renewal_date?: string | null;
  retries?: number;
  first_transaction_date?: string | null;
  user_type?: 'free' | 'pro';
  subscription_status?: 'N/A' | 'Active' | 'Unsubscribe' | 'No renewal';
  subscription_type?: '1' | '3' | '12';
  provider?: 'stripe' | 'macropay';
}

export class PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class UserTransaction {
  id: string;
  id_transaction: string;
  transaction_type: string;
  transaction_status: string;
  amount: number;
  currency: string;
  payment_type: string;
  payment_date: string | null;
  created_at: string | null;
  subscription_id: string;
  can_refund: boolean;
  refund_status: string;
}

export class UserTransactionsSummary {
  total_transactions: number;
  successful_payments: number;
  failed_payments: number;
  refunds: number;
  total_amount_paid: number;
  total_refunded: number;
}

export class UserWithTransactions {
  user: {
    id: string;
    email: string;
    name?: string;
    company_name?: string;
    language?: string;
    created_at: string | null;
    subscription_status?: string;
  };
  transactions: UserTransaction[];
  summary: UserTransactionsSummary;
}
