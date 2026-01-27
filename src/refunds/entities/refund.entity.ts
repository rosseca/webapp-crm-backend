export class RefundResult {
  id: string;
  status: string;
  amount: number;
  currency: string;
  created: number;
  reason: string | null;
}

export class OriginalTransaction {
  id: string;
  id_transaction: string;
  amount: number;
  currency: string;
}

export class RefundResponse {
  success: boolean;
  message: string;
  data: {
    refund: RefundResult;
    original_transaction: OriginalTransaction;
  };
}
