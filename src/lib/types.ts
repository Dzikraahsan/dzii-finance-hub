export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Wallet {
  id: string;
  name: string;
  type: 'cash' | 'e-wallet' | 'bank' | 'credit-card';
  balance: number;
  icon: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  note?: string;
  receiptUrl?: string;
  tags?: string[];
  date: string;
  createdAt: string;
  toWalletId?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  used: number;
  month: string;
}

export interface Insight {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  createdAt: string;
}
