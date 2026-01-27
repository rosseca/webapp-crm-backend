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
