import { mockTransactions, mockCategories, mockWallets } from '@/lib/mock-data';
import { formatCurrency, formatDate } from '@/lib/format';
import { Search, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function Transactions() {
  const [search, setSearch] = useState('');

  const grouped = useMemo(() => {
    const filtered = mockTransactions.filter(t => {
      const cat = mockCategories.find(c => c.id === t.categoryId);
      return !search || cat?.name.toLowerCase().includes(search.toLowerCase()) || t.note?.toLowerCase().includes(search.toLowerCase());
    });
    const map: Record<string, typeof filtered> = {};
    filtered.forEach(t => {
      const key = t.date;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [search]);

  return (
    <div className="px-4 pt-6 animate-fade-in">
      <h1 className="text-xl font-bold text-foreground mb-4">Transactions</h1>

      {/* Search */}
      <div className="flex gap-2 mb-5">
        <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <button className="w-11 h-11 bg-card border border-border rounded-xl flex items-center justify-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* List */}
      <div className="space-y-5">
        {grouped.map(([date, txns]) => (
          <div key={date}>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{formatDate(date)}</p>
            <div className="space-y-2">
              {txns.map(txn => {
                const cat = mockCategories.find(c => c.id === txn.categoryId);
                const wallet = mockWallets.find(w => w.id === txn.walletId);
                return (
                  <div key={txn.id} className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: (cat?.color || '#666') + '20' }}>
                      {cat?.icon || '❓'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{cat?.name}</p>
                      <p className="text-xs text-muted-foreground">{wallet?.name}{txn.note ? ` · ${txn.note}` : ''}</p>
                    </div>
                    <p className={`text-sm font-semibold ${txn.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
