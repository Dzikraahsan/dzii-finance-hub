import { formatCurrency } from '@/lib/format';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface TransactionData {
  id: string;
  wallet_id: string;
  to_wallet_id: string | null;
  category_id: string | null;
  amount: number;
  type: string;
  note: string | null;
  date: string;
}

interface CategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface WalletData {
  id: string;
  name: string;
}

interface Props {
  txn: TransactionData;
  category?: CategoryData | null;
  wallet?: WalletData | null;
  onEdit: (txn: TransactionData) => void;
  onDelete: (txn: TransactionData) => void;
}

export default function TransactionItem({ txn, category, wallet, onEdit, onDelete }: Props) {
  const [showActions, setShowActions] = useState(false);

  // Format Rupiah Indonesia
  const formatRupiah = (num) => {
    return "Rp" + new Intl.NumberFormat("id-ID").format(num);
  };

  return (
    <div
      className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border card-interactive"
      onClick={() => setShowActions(!showActions)}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ backgroundColor: (category?.color || '#666') + '20' }}>
        {category?.icon || '🔄'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-card-foreground truncate">{category?.name || 'Transfer'}</p>
        <p className="text-xs text-muted-foreground truncate">{wallet?.name}{txn.note ? ` · ${txn.note}` : ''}</p>
      </div>
      {showActions ? (
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={e => { e.stopPropagation(); onEdit(txn); setShowActions(false); }}
            className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center transition-all active:scale-90">
            <Pencil className="w-3.5 h-3.5 text-primary" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(txn); setShowActions(false); }}
            className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center transition-all active:scale-90">
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      ) : (
        <p className={`text-sm font-semibold shrink-0 ${txn.type === 'income' ? 'text-[hsl(var(--accent-text))]' : txn.type === 'transfer' ? 'text-primary' : 'text-red-400'}`}>
          {txn.type === 'income' ? '+' : txn.type === 'transfer' ? '' : '-'}{formatRupiah(Number(txn.amount))}
        </p>
      )}
    </div>
  );
}
