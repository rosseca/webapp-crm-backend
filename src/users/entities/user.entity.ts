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
