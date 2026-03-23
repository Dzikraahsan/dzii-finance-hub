import { useWallets } from '@/hooks/useFinanceData';
import { formatCurrency } from '@/lib/format';
import { Plus, CreditCard } from 'lucide-react';

export default function Wallets() {
  const { data: wallets = [] } = useWallets();
  const total = wallets.reduce((s, w) => s + Number(w.balance), 0);

  return (
    <div className="px-4 pt-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Wallets</h1>
        <button className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <Plus className="w-4 h-4 text-primary" />
        </button>
      </div>
      <div className="bg-card border border-border rounded-2xl p-5 text-center">
        <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
        <p className="balance-number text-foreground">{formatCurrency(total)}</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{wallets.length} wallets</span>
        </div>
      </div>
      <div className="space-y-3">
        {wallets.map(wallet => (
          <div key={wallet.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98]">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: wallet.color + '20' }}>{wallet.icon}</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-card-foreground">{wallet.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{wallet.type.replace('-', ' ')}</p>
            </div>
            <p className="stat-number text-card-foreground">{formatCurrency(Number(wallet.balance))}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
