export interface Transaction {
  id: string;
  detail: string;
  amount: number;
  type: 'Cr' | 'Db';
  status: string;
  category: string;
  date: Date;
  /** Owner's email - used for Partner Mode to identify who created the transaction */
  ownerEmail?: string;
}
