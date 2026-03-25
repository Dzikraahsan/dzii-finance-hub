import { useTransactions, useCategories, useWallets, useDeleteTransaction } from '@/hooks/useFinanceData';
import { formatDate } from '@/lib/format';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { useState, useMemo } from 'react';
import TransactionItem from '@/components/TransactionItem';
import TransactionFilterSheet, { TransactionFilters, defaultFilters, hasActiveFilters } from '@/components/TransactionFilterSheet';
import EditTransactionSheet from '@/components/EditTransactionSheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function Transactions() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: wallets = [] } = useWallets();
  const deleteTxn = useDeleteTransaction();
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters);
  const [editTxn, setEditTxn] = useState<any>(null);
  const [deletingTxn, setDeletingTxn] = useState<any>(null);
  const active = hasActiveFilters(filters);

  const grouped = useMemo(() => {
    let filtered = transactions;

    // Search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t => {
        const cat = categories.find(c => c.id === t.category_id);
        return cat?.name.toLowerCase().includes(q) || t.note?.toLowerCase().includes(q);
      });
    }

    // Type filter
    if (filters.type) filtered = filtered.filter(t => t.type === filters.type);

    // Category filter
    if (filters.categoryId) filtered = filtered.filter(t => t.category_id === filters.categoryId);

    // Wallet filter
    if (filters.walletId) filtered = filtered.filter(t => t.wallet_id === filters.walletId || t.to_wallet_id === filters.walletId);

    // Date filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoff = new Date();
      if (filters.dateRange === 'today') {
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (filters.dateRange === 'week') {
        cutoff.setDate(now.getDate() - 7);
      } else if (filters.dateRange === 'month') {
        cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      filtered = filtered.filter(t => new Date(t.date) >= cutoff);
    }

    const map: Record<string, typeof filtered> = {};
    filtered.forEach(t => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions, categories, search, filters]);

  const handleDeleteConfirm = async () => {
    if (!deletingTxn) return;
    try {
      await deleteTxn.mutateAsync(deletingTxn);
      toast.success('Transaction deleted');
    } catch { toast.error('Failed to delete'); }
    setDeletingTxn(null);
  };

  return (
    <div className="px-4 pt-6 animate-fade-in">
      <h1 className="text-xl font-bold text-foreground mb-4">Transactions</h1>
      <div className="flex gap-2 mb-5">
        <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0" />
        </div>
        <button onClick={() => setShowFilter(true)}
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${active ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>
          <SlidersHorizontal className={`w-4 h-4 ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
        </button>
      </div>

      {active && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-primary font-medium">Filters active</span>
          <button onClick={() => setFilters(defaultFilters)} className="text-xs text-muted-foreground underline">Clear all</button>
        </div>
      )}

      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No transactions found</p>
      ) : (
        <div className="space-y-5">
          {grouped.map(([date, txns]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{formatDate(date)}</p>
              <div className="space-y-2">
                {txns.map(txn => {
                  const cat = categories.find(c => c.id === txn.category_id);
                  const wallet = wallets.find(w => w.id === txn.wallet_id);
                  return (
                    <TransactionItem key={txn.id} txn={txn as any} category={cat as any} wallet={wallet as any}
                      onEdit={setEditTxn} onDelete={setDeletingTxn} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <TransactionFilterSheet open={showFilter} onOpenChange={setShowFilter} filters={filters} onApply={setFilters} />
      <EditTransactionSheet open={!!editTxn} onOpenChange={v => { if (!v) setEditTxn(null); }} transaction={editTxn} />
      <AlertDialog open={!!deletingTxn} onOpenChange={v => { if (!v) setDeletingTxn(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this transaction and reverse the wallet balance.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}