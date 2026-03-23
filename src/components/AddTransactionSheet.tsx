import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';
import { mockWallets, mockCategories } from '@/lib/mock-data';
import { TransactionType } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const typeColors: Record<TransactionType, string> = {
  income: 'bg-success text-success-foreground',
  expense: 'bg-destructive text-destructive-foreground',
  transfer: 'bg-primary text-primary-foreground',
};

export default function AddTransactionSheet({ open, onOpenChange }: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState(mockWallets[0]?.id || '');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');

  const categories = mockCategories.filter(c =>
    type === 'transfer' ? true : c.type === type
  );

  const handleAmountKey = (key: string) => {
    if (key === 'del') setAmount(prev => prev.slice(0, -1));
    else if (key === '.' && amount.includes('.')) return;
    else setAmount(prev => prev + key);
  };

  const handleSubmit = () => {
    if (!amount || !walletId) return;
    // TODO: Save to backend
    onOpenChange(false);
    setAmount('');
    setNote('');
    setCategoryId('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl border-t border-border p-0 bg-background">
        <div className="flex flex-col h-full overflow-y-auto">
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle className="text-lg font-bold">Add Transaction</SheetTitle>
          </SheetHeader>

          {/* Type Toggle */}
          <div className="flex gap-2 px-5 mb-4">
            {(['expense', 'income', 'transfer'] as TransactionType[]).map(t => (
              <button
                key={t}
                onClick={() => { setType(t); setCategoryId(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                  type === t ? typeColors[t] : 'bg-secondary text-muted-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount Display */}
          <div className="text-center px-5 mb-4">
            <p className="text-muted-foreground text-xs mb-1">Amount</p>
            <p className="balance-number text-foreground">
              {amount ? formatCurrency(Number(amount)) : 'Rp 0'}
            </p>
          </div>

          {/* Wallet Selector */}
          <div className="px-5 mb-4">
            <p className="text-xs text-muted-foreground mb-2">Wallet</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {mockWallets.map(w => (
                <button
                  key={w.id}
                  onClick={() => setWalletId(w.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    walletId === w.id
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'bg-card text-card-foreground border border-border'
                  }`}
                >
                  <span>{w.icon}</span>
                  <span>{w.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Grid */}
          <div className="px-5 mb-4">
            <p className="text-xs text-muted-foreground mb-2">Category</p>
            <div className="grid grid-cols-4 gap-2">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-all ${
                    categoryId === c.id
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'bg-card text-card-foreground border border-border'
                  }`}
                >
                  <span className="text-lg">{c.icon}</span>
                  <span className="truncate w-full text-center">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="px-5 mb-4">
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Numpad */}
          <div className="mt-auto px-5 pb-5">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {['1','2','3','4','5','6','7','8','9','.','0','del'].map(key => (
                <button
                  key={key}
                  onClick={() => handleAmountKey(key)}
                  className="py-3.5 rounded-xl bg-card text-card-foreground text-lg font-semibold active:bg-secondary transition-colors border border-border"
                >
                  {key === 'del' ? '⌫' : key}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!amount || !categoryId}
              className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold text-base disabled:opacity-40 transition-all active:scale-[0.98]"
            >
              Save Transaction
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
