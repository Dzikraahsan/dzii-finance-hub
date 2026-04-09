/**
 * Centralized Finance Engine
 * Single source of truth for all transaction analysis, filtering, grouping, and insights.
 */

// ─── Date Utilities ───────────────────────────────────────────────
export function normalize(date: string): string {
  return date.slice(0, 10);
}

export function getTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isSameDay(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

export function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

export function formatISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Transaction Types ───────────────────────────────────────────
export interface Transaction {
  id: string;
  wallet_id: string;
  to_wallet_id: string | null;
  category_id: string | null;
  amount: number;
  type: string;
  note: string | null;
  date: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
}

// ─── Filtering ───────────────────────────────────────────────────
export type FilterMode = 'day' | 'week' | 'month' | 'all';

export function filterTransactions(
  transactions: Transaction[],
  mode: FilterMode,
  selectedDate: string
): Transaction[] {
  const target = new Date(selectedDate + 'T00:00:00');

  switch (mode) {
    case 'day':
      return transactions.filter(t => normalize(t.date) === normalize(selectedDate));

    case 'week': {
      const start = formatISO(getStartOfWeek(target));
      const end = formatISO(getEndOfWeek(target));
      return transactions.filter(t => {
        const d = normalize(t.date);
        return d >= start && d <= end;
      });
    }

    case 'month': {
      const prefix = selectedDate.slice(0, 7);
      return transactions.filter(t => t.date.startsWith(prefix));
    }

    case 'all':
    default:
      return transactions;
  }
}

// ─── Grouping ────────────────────────────────────────────────────
export interface DayGroup {
  date: string;
  income: number;
  expense: number;
  net: number;
  transactions: Transaction[];
}

export function groupTransactionsByDay(transactions: Transaction[]): DayGroup[] {
  const map: Record<string, { income: number; expense: number; transactions: Transaction[] }> = {};

  transactions.forEach(t => {
    const key = normalize(t.date);
    if (!map[key]) map[key] = { income: 0, expense: 0, transactions: [] };
    if (t.type === 'income') map[key].income += Number(t.amount);
    else if (t.type === 'expense') map[key].expense += Number(t.amount);
    map[key].transactions.push(t);
  });

  return Object.entries(map)
    .map(([date, data]) => ({
      date,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
      transactions: data.transactions,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Aggregation ─────────────────────────────────────────────────
export interface Summary {
  income: number;
  expense: number;
  net: number;
  count: number;
}

export function summarize(transactions: Transaction[]): Summary {
  let income = 0, expense = 0, count = 0;
  transactions.forEach(t => {
    if (t.type === 'income') income += Number(t.amount);
    else if (t.type === 'expense') expense += Number(t.amount);
    count++;
  });
  return { income, expense, net: income - expense, count };
}

// ─── Insight Engine ──────────────────────────────────────────────
export interface Insight {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'trend';
  icon: string;
}

export function generateInsights(
  transactions: Transaction[],
  categories: Category[]
): Insight[] {
  const insights: Insight[] = [];
  const today = getTodayISO();
  const now = new Date();

  // Current month
  const thisMonth = today.slice(0, 7);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = formatISO(lastMonthDate).slice(0, 7);

  const thisMonthTxns = transactions.filter(t => t.date.startsWith(thisMonth));
  const lastMonthTxns = transactions.filter(t => t.date.startsWith(lastMonth));

  const thisMonthSummary = summarize(thisMonthTxns);
  const lastMonthSummary = summarize(lastMonthTxns);

  // 1. Spending trend vs last month
  if (lastMonthSummary.expense > 0 && thisMonthSummary.expense > 0) {
    const pctChange = ((thisMonthSummary.expense - lastMonthSummary.expense) / lastMonthSummary.expense) * 100;
    if (pctChange > 15) {
      insights.push({
        id: 'spending-up',
        message: `Spending is up ${Math.round(pctChange)}% compared to last month. Consider reviewing your expenses.`,
        type: 'warning',
        icon: '📈',
      });
    } else if (pctChange < -10) {
      insights.push({
        id: 'spending-down',
        message: `Great job! Spending is down ${Math.abs(Math.round(pctChange))}% compared to last month.`,
        type: 'success',
        icon: '🎉',
      });
    }
  }

  // 2. Top category
  const expenseByCategory: Record<string, number> = {};
  thisMonthTxns.filter(t => t.type === 'expense').forEach(t => {
    expenseByCategory[t.category_id || ''] = (expenseByCategory[t.category_id || ''] || 0) + Number(t.amount);
  });
  const sortedCats = Object.entries(expenseByCategory).sort(([, a], [, b]) => b - a);
  if (sortedCats.length > 0 && thisMonthSummary.expense > 0) {
    const [topCatId, topAmount] = sortedCats[0];
    const cat = categories.find(c => c.id === topCatId);
    const pct = Math.round((topAmount / thisMonthSummary.expense) * 100);
    if (pct > 30) {
      insights.push({
        id: 'top-category',
        message: `${cat?.icon || '📦'} ${cat?.name || 'Unknown'} accounts for ${pct}% of your spending this month.`,
        type: 'info',
        icon: '🏷️',
      });
    }
  }

  // 3. Today's spending vs daily average
  const todayTxns = transactions.filter(t => normalize(t.date) === today);
  const todayExpense = todayTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const daysInMonth = now.getDate();
  const dailyAvg = daysInMonth > 1 ? thisMonthSummary.expense / daysInMonth : 0;

  if (todayExpense > dailyAvg * 1.5 && dailyAvg > 0) {
    insights.push({
      id: 'high-today',
      message: `Today's spending is ${Math.round((todayExpense / dailyAvg - 1) * 100)}% above your daily average.`,
      type: 'warning',
      icon: '⚡',
    });
  }

  // 4. No transactions today
  if (todayTxns.length === 0 && transactions.length > 0) {
    insights.push({
      id: 'no-today',
      message: 'No transactions recorded today. Keep tracking your finances!',
      type: 'info',
      icon: '📝',
    });
  }

  // 5. Income change
  if (lastMonthSummary.income > 0 && thisMonthSummary.income > 0) {
    const incChange = ((thisMonthSummary.income - lastMonthSummary.income) / lastMonthSummary.income) * 100;
    if (incChange < -20) {
      insights.push({
        id: 'income-drop',
        message: `Income dropped ${Math.abs(Math.round(incChange))}% compared to last month.`,
        type: 'warning',
        icon: '💸',
      });
    }
  }

  // 6. Savings rate
  if (thisMonthSummary.income > 0) {
    const savingsRate = Math.round(((thisMonthSummary.income - thisMonthSummary.expense) / thisMonthSummary.income) * 100);
    if (savingsRate > 20) {
      insights.push({
        id: 'savings-rate',
        message: `You're saving ${savingsRate}% of your income this month. Keep it up!`,
        type: 'success',
        icon: '💰',
      });
    } else if (savingsRate < 0) {
      insights.push({
        id: 'overspend',
        message: `You're spending more than you earn this month. Time to review your budget.`,
        type: 'warning',
        icon: '🚨',
      });
    }
  }

  return insights.slice(0, 3);
}

// ─── Auto Category Detection ────────────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Food': ['makan', 'food', 'resto', 'restaurant', 'kopi', 'coffee', 'snack', 'lunch', 'dinner', 'breakfast', 'nasi', 'ayam', 'bakso', 'mie', 'sate', 'burger', 'pizza', 'sushi', 'indomie', 'warung', 'cafe', 'starbucks', 'mcdonalds', 'kfc', 'grab food', 'gofood', 'shopee food'],
  'Transport': ['bensin', 'fuel', 'gas', 'transport', 'uber', 'grab', 'gojek', 'taxi', 'bus', 'train', 'kereta', 'ojek', 'parkir', 'parking', 'toll', 'tol', 'bbm', 'pertamina', 'shell'],
  'Shopping': ['belanja', 'shopping', 'beli', 'buy', 'toko', 'store', 'mall', 'tokopedia', 'shopee', 'lazada', 'blibli', 'amazon', 'fashion', 'baju', 'sepatu', 'shoes', 'clothes'],
  'Bills': ['listrik', 'electric', 'air', 'water', 'internet', 'wifi', 'pulsa', 'phone', 'sewa', 'rent', 'tagihan', 'bill', 'pdam', 'pln', 'telkom', 'indihome', 'subscription', 'netflix', 'spotify', 'youtube'],
  'Entertainment': ['game', 'film', 'movie', 'bioskop', 'cinema', 'hiburan', 'entertainment', 'karaoke', 'gym', 'sport', 'olahraga', 'concert', 'konser', 'tiket', 'ticket'],
  'Health': ['obat', 'medicine', 'dokter', 'doctor', 'rumah sakit', 'hospital', 'klinik', 'clinic', 'apotek', 'pharmacy', 'vitamin', 'health', 'kesehatan'],
  'Education': ['buku', 'book', 'kursus', 'course', 'sekolah', 'school', 'kuliah', 'university', 'tuition', 'udemy', 'coursera', 'belajar', 'learn'],
  'Salary': ['gaji', 'salary', 'payroll', 'upah', 'wage'],
  'Freelance': ['freelance', 'project', 'proyek', 'client', 'invoice', 'jasa', 'service'],
  'Investment': ['investasi', 'investment', 'saham', 'stock', 'crypto', 'bitcoin', 'reksadana', 'mutual fund', 'dividen', 'dividend', 'return'],
};

export function detectCategory(note: string, categories: Category[]): string | null {
  if (!note) return null;
  const lower = note.toLowerCase();

  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        const match = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
        if (match) return match.id;
      }
    }
  }

  return null;
}

// ─── Formatting ──────────────────────────────────────────────────
export function formatRupiah(num: number): string {
  return "Rp" + new Intl.NumberFormat("id-ID").format(num);
}
