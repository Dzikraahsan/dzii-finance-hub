import { Wallet, Category, Transaction, Budget, Insight } from './types';

export const mockWallets: Wallet[] = [
  { id: 'w1', name: 'Cash', type: 'cash', balance: 2500000, icon: '💵', color: '#22c55e' },
  { id: 'w2', name: 'BCA', type: 'bank', balance: 15000000, icon: '🏦', color: '#3b82f6' },
  { id: 'w3', name: 'GoPay', type: 'e-wallet', balance: 850000, icon: '📱', color: '#06b6d4' },
  { id: 'w4', name: 'OVO', type: 'e-wallet', balance: 320000, icon: '💜', color: '#8b5cf6' },
];

export const mockCategories: Category[] = [
  { id: 'c1', name: 'Salary', type: 'income', icon: '💼', color: '#22c55e' },
  { id: 'c2', name: 'Freelance', type: 'income', icon: '💻', color: '#06b6d4' },
  { id: 'c3', name: 'Investment', type: 'income', icon: '📈', color: '#8b5cf6' },
  { id: 'c4', name: 'Food', type: 'expense', icon: '🍔', color: '#f97316' },
  { id: 'c5', name: 'Transport', type: 'expense', icon: '🚗', color: '#3b82f6' },
  { id: 'c6', name: 'Shopping', type: 'expense', icon: '🛍️', color: '#ec4899' },
  { id: 'c7', name: 'Bills', type: 'expense', icon: '📄', color: '#ef4444' },
  { id: 'c8', name: 'Entertainment', type: 'expense', icon: '🎮', color: '#a855f7' },
  { id: 'c9', name: 'Health', type: 'expense', icon: '🏥', color: '#14b8a6' },
  { id: 'c10', name: 'Education', type: 'expense', icon: '📚', color: '#f59e0b' },
];

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };

export const mockTransactions: Transaction[] = [
  { id: 't1', walletId: 'w2', categoryId: 'c1', amount: 12000000, type: 'income', note: 'Monthly salary', date: daysAgo(2), createdAt: daysAgo(2) },
  { id: 't2', walletId: 'w1', categoryId: 'c4', amount: 85000, type: 'expense', note: 'Lunch with team', date: daysAgo(0), createdAt: daysAgo(0) },
  { id: 't3', walletId: 'w3', categoryId: 'c5', amount: 35000, type: 'expense', note: 'Grab ride', date: daysAgo(0), createdAt: daysAgo(0) },
  { id: 't4', walletId: 'w2', categoryId: 'c7', amount: 1500000, type: 'expense', note: 'Electricity bill', date: daysAgo(1), createdAt: daysAgo(1) },
  { id: 't5', walletId: 'w4', categoryId: 'c6', amount: 250000, type: 'expense', note: 'New earphones', date: daysAgo(1), createdAt: daysAgo(1) },
  { id: 't6', walletId: 'w2', categoryId: 'c2', amount: 3500000, type: 'income', note: 'Website project', date: daysAgo(3), createdAt: daysAgo(3) },
  { id: 't7', walletId: 'w1', categoryId: 'c4', amount: 45000, type: 'expense', note: 'Coffee', date: daysAgo(3), createdAt: daysAgo(3) },
  { id: 't8', walletId: 'w3', categoryId: 'c8', amount: 120000, type: 'expense', note: 'Netflix', date: daysAgo(4), createdAt: daysAgo(4) },
  { id: 't9', walletId: 'w2', categoryId: 'c9', amount: 350000, type: 'expense', note: 'Doctor visit', date: daysAgo(5), createdAt: daysAgo(5) },
  { id: 't10', walletId: 'w1', categoryId: 'c4', amount: 65000, type: 'expense', note: 'Dinner', date: daysAgo(6), createdAt: daysAgo(6) },
];

export const mockBudgets: Budget[] = [
  { id: 'b1', categoryId: 'c4', amount: 2000000, used: 1450000, month: fmt(today).slice(0, 7) },
  { id: 'b2', categoryId: 'c5', amount: 500000, used: 350000, month: fmt(today).slice(0, 7) },
  { id: 'b3', categoryId: 'c6', amount: 1000000, used: 950000, month: fmt(today).slice(0, 7) },
  { id: 'b4', categoryId: 'c7', amount: 2500000, used: 1500000, month: fmt(today).slice(0, 7) },
  { id: 'b5', categoryId: 'c8', amount: 500000, used: 120000, month: fmt(today).slice(0, 7) },
];

export const mockInsights: Insight[] = [
  { id: 'i1', message: 'Your food spending is 72% of your monthly budget. Consider meal prepping to save more.', type: 'warning', createdAt: daysAgo(0) },
  { id: 'i2', message: 'Great job! Your income this month is 15% higher than last month.', type: 'success', createdAt: daysAgo(1) },
  { id: 'i3', message: 'Shopping is at 95% of budget — almost at the limit!', type: 'warning', createdAt: daysAgo(0) },
];

export const chartData7Days = Array.from({ length: 7 }, (_, i) => ({
  date: daysAgo(6 - i),
  income: Math.floor(Math.random() * 2000000) + 500000,
  expense: Math.floor(Math.random() * 1500000) + 200000,
}));
