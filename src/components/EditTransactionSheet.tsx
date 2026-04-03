import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { useWallets, useCategories } from '@/hooks/useFinanceData';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

type TxnType = 'income' | 'expense' | 'transfer';
const typeColors: Record<TxnType, string> = {
  income: 'bg-success text-success-foreground',
  expense: 'bg-destructive text-destructive-foreground',
  transfer: 'bg-primary text-primary-foreground',
};

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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  transaction: TransactionData | null;
}

export default function EditTransactionSheet({ open, onOpenChange, transaction }: Props) {
  const { data: wallets = [] } = useWallets();
  const { data: categories = [] } = useCategories();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [type, setType] = useState<TxnType>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type as TxnType);
      setAmount(String(transaction.amount));
      setWalletId(transaction.wallet_id);
      setToWalletId(transaction.to_wallet_id || '');
      setCategoryId(transaction.category_id || '');
      setNote(transaction.note || '');
    }
  }, [transaction]);

  const filteredCategories = categories.filter(c => type === 'transfer' ? false : c.type === type);

  const handleAmountKey = (key: string) => {
    if (key === 'del') setAmount(prev => prev.slice(0, -1));
    else if (key === '.' && amount.includes('.')) return;
    else setAmount(prev => prev + key);
  };

  const handleSubmit = async () => {
    if (!transaction || !user) return;
    const amt = Number(amount);
    if (!amt || !walletId) return;
    if (type !== 'transfer' && !categoryId) return;
    if (type === 'transfer' && !toWalletId) return;

    setSaving(true);
    try {
      const oldTxn = transaction;

      // Reverse old wallet effects
      if (oldTxn.type === 'income') {
        const { data: w } = await supabase.from('wallets').select('balance').eq('id', oldTxn.wallet_id).single();
        if (w) await supabase.from('wallets').update({ balance: Number(w.balance) - oldTxn.amount }).eq('id', oldTxn.wallet_id);
      } else if (oldTxn.type === 'expense') {
        const { data: w } = await supabase.from('wallets').select('balance').eq('id', oldTxn.wallet_id).single();
        if (w) await supabase.from('wallets').update({ balance: Number(w.balance) + oldTxn.amount }).eq('id', oldTxn.wallet_id);
      } else if (oldTxn.type === 'transfer') {
        const { data: fw } = await supabase.from('wallets').select('balance').eq('id', oldTxn.wallet_id).single();
        if (fw) await supabase.from('wallets').update({ balance: Number(fw.balance) + oldTxn.amount }).eq('id', oldTxn.wallet_id);
        if (oldTxn.to_wallet_id) {
          const { data: tw } = await supabase.from('wallets').select('balance').eq('id', oldTxn.to_wallet_id).single();
          if (tw) await supabase.from('wallets').update({ balance: Number(tw.balance) - oldTxn.amount }).eq('id', oldTxn.to_wallet_id);
        }
      }

      // Update transaction
      await supabase.from('transactions').update({
        wallet_id: walletId,
        category_id: type === 'transfer' ? null : categoryId,
        amount: amt,
        type,
        note: note || null,
        to_wallet_id: type === 'transfer' ? toWalletId : null,
      }).eq('id', transaction.id);

      // Apply new wallet effects
      if (type === 'income') {
        const { data: w } = await supabase.from('wallets').select('balance').eq('id', walletId).single();
        if (w) await supabase.from('wallets').update({ balance: Number(w.balance) + amt }).eq('id', walletId);
      } else if (type === 'expense') {
        const { data: w } = await supabase.from('wallets').select('balance').eq('id', walletId).single();
        if (w) await supabase.from('wallets').update({ balance: Number(w.balance) - amt }).eq('id', walletId);
      } else if (type === 'transfer' && toWalletId) {
        const { data: fw } = await supabase.from('wallets').select('balance').eq('id', walletId).single();
        if (fw) await supabase.from('wallets').update({ balance: Number(fw.balance) - amt }).eq('id', walletId);
        const { data: tw } = await supabase.from('wallets').select('balance').eq('id', toWalletId).single();
        if (tw) await supabase.from('wallets').update({ balance: Number(tw.balance) + amt }).eq('id', toWalletId);
      }

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Transaction updated!');
      onOpenChange(false);
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // Format Rupiah Indonesia
  const formatRupiah = (num) => {
    return "Rp" + new Intl.NumberFormat("id-ID").format(num);
  };

  return (
    <Sheet open={open && !!transaction} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl border-t border-border p-0 bg-background">
        <div className="flex flex-col h-full overflow-y-auto">
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle className="text-lg font-bold">Edit Transaction</SheetTitle>
          </SheetHeader>

          {/* Type Toggle */}
          <div className="flex gap-2 px-5 mb-4">
            {(['expense', 'income', 'transfer'] as TxnType[]).map(t => (
              <button key={t} onClick={() => { setType(t); if (t === 'transfer') setCategoryId(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${type === t ? typeColors[t] : 'bg-secondary text-muted-foreground'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="text-center px-5 mb-4">
            <p className="text-muted-foreground text-xs mb-1">Amount</p>
            <p className="balance-number text-foreground">{amount ? formatRupiah(Number(amount)) : 'Rp0'}</p>
          </div>

          {/* Wallet */}
          <div className="px-5 mb-4">
            <p className="text-xs text-muted-foreground mb-2">{type === 'transfer' ? 'From Wallet' : 'Wallet'}</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {wallets.map(w => (
                <button key={w.id} onClick={() => setWalletId(w.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    walletId === w.id ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-card text-card-foreground border border-border'
                  }`}>
                  <span>{w.icon}</span><span>{w.name}</span>
                </button>
              ))}
            </div>
          </div>

          {type === 'transfer' && (
            <div className="px-5 mb-4">
              <p className="text-xs text-muted-foreground mb-2">To Wallet</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {wallets.filter(w => w.id !== walletId).map(w => (
                  <button key={w.id} onClick={() => setToWalletId(w.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      toWalletId === w.id ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-card text-card-foreground border border-border'
                    }`}>
                    <span>{w.icon}</span><span>{w.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {type !== 'transfer' && (
            <div className="px-5 mb-4">
              <p className="text-xs text-muted-foreground mb-2">Category</p>
              <div className="grid grid-cols-4 gap-2">
                {filteredCategories.map(c => (
                  <button key={c.id} onClick={() => setCategoryId(c.id)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-all ${
                      categoryId === c.id ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-card text-card-foreground border border-border'
                    }`}>
                    <span className="text-lg">{c.icon}</span>
                    <span className="truncate w-full text-center">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-5 mb-6">
            <p className="text-xs text-muted-foreground mb-2">Note</p>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          {/* Numpad */}
          <div className="mt-auto px-5 pb-5">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {['1','2','3','4','5','6','7','8','9','.','0','del'].map(key => (
                <button key={key} onClick={() => handleAmountKey(key)}
                  className="py-3 rounded-xl bg-card text-card-foreground text-lg font-semibold active:bg-secondary transition-colors border border-border">
                  {key === 'del' ? '⌫' : key}
                </button>
              ))}
            </div>
            <button onClick={handleSubmit}
              disabled={!amount || (type !== 'transfer' && !categoryId) || (type === 'transfer' && !toWalletId) || saving}
              className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm disabled:opacity-40 transition-all active:scale-[0.98]">
              {saving ? 'Updating...' : 'Update Transaction'}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
