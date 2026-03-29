import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAddWallet, useUpdateWallet } from '@/hooks/useFinanceData';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editWallet?: { id: string; name: string; type: string; balance: number; icon: string; color: string; account_number?: string | null; provider?: string | null } | null;
}

const walletTypes = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'bank', label: 'Bank Account', icon: '🏦' },
  { value: 'e-wallet', label: 'E-Wallet', icon: '📱' },
  { value: 'credit-card', label: 'Credit Card', icon: '💳' },
  { value: 'savings', label: 'Savings', icon: '🐷' },
  { value: 'virtual-account', label: 'Virtual Account', icon: '🔗' },
  { value: 'investment', label: 'Investment', icon: '📈' },
];

const providersByType: Record<string, string[]> = {
  bank: ['BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB', 'Permata', 'Other'],
  'e-wallet': ['Dana', 'OVO', 'GoPay', 'ShopeePay', 'LinkAja', 'Other'],
  'credit-card': ['Visa', 'Mastercard', 'BCA Card', 'Mandiri Card', 'Other'],
  savings: ['BCA', 'Mandiri', 'BNI', 'BRI', 'Other'],
  'virtual-account': ['BCA VA', 'Mandiri VA', 'BNI VA', 'Other'],
};

const walletColors = ['#22c55e', '#3b82f6', '#f97316', '#ec4899', '#a855f7', '#14b8a6', '#ef4444', '#f59e0b'];

const typesWithProvider = ['bank', 'e-wallet', 'credit-card', 'savings', 'virtual-account'];
const typesWithAccountNumber = ['bank', 'credit-card', 'savings', 'virtual-account'];

export default function AddWalletSheet({ open, onOpenChange, editWallet }: Props) {
  const addWallet = useAddWallet();
  const updateWallet = useUpdateWallet();
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [accountNumber, setAccountNumber] = useState('');
  const [provider, setProvider] = useState('');

  useEffect(() => {
    if (editWallet) {
      setName(editWallet.name);
      setType(editWallet.type);
      setBalance(String(editWallet.balance));
      setColor(editWallet.color);
      setAccountNumber(editWallet.account_number || '');
      setProvider(editWallet.provider || '');
    } else {
      setName('');
      setType('cash');
      setBalance('');
      setColor('#3b82f6');
      setAccountNumber('');
      setProvider('');
    }
  }, [editWallet, open]);

  const selectedIcon = walletTypes.find(w => w.value === type)?.icon || '💵';
  const showProvider = typesWithProvider.includes(type);
  const showAccountNumber = typesWithAccountNumber.includes(type);
  const providers = providersByType[type] || [];

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      type,
      balance: Number(balance) || 0,
      icon: selectedIcon,
      color,
      account_number: showAccountNumber && accountNumber.trim() ? accountNumber.trim() : null,
      provider: showProvider && provider.trim() ? provider.trim() : null,
    };

    try {
      if (editWallet) {
        await updateWallet.mutateAsync({ id: editWallet.id, ...payload });
      } else {
        await addWallet.mutateAsync(payload);
      }
      toast.success(editWallet ? 'Wallet updated!' : 'Wallet created!');
      onOpenChange(false);
    } catch {
      toast.error('Failed to save wallet');
    }
  };

  const isPending = addWallet.isPending || updateWallet.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-t border-border p-0 bg-background max-h-[85vh]">
        <div className="flex flex-col overflow-y-auto max-h-[85vh]">
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle className="text-lg font-bold">{editWallet ? 'Edit Wallet' : 'Add Wallet'}</SheetTitle>
          </SheetHeader>

          <div className="px-5 space-y-5 pb-5">
            {/* Name */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Wallet Name</p>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. My Bank Account"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 input-glow" />
            </div>

            {/* Type */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Type</p>
              <div className="grid grid-cols-2 gap-2">
                {walletTypes.map(w => (
                  <button key={w.value} onClick={() => { setType(w.value); setProvider(''); setAccountNumber(''); }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      type === w.value ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-card text-card-foreground border border-border'
                    }`}>
                    <span className="text-lg">{w.icon}</span>
                    <span className="truncate">{w.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Provider */}
            {showProvider && providers.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Provider</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {providers.map(p => (
                    <button key={p} onClick={() => setProvider(p)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                        provider === p ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-card text-card-foreground border border-border'
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Account Number */}
            {showAccountNumber && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Account Number (optional)</p>
                <input value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/[^0-9\-]/g, ''))} placeholder="e.g. 1234567890"
                  inputMode="numeric"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 input-glow" />
              </div>
            )}

            {/* Initial Balance */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">{editWallet ? 'Balance' : 'Initial Balance'}</p>
              <input value={balance} onChange={e => setBalance(e.target.value.replace(/[^0-9.\-]/g, ''))} placeholder="0" inputMode="decimal"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 input-glow" />
              {type === 'credit-card' && (
                <p className="text-xs text-muted-foreground mt-1">Tip: Use negative balance for outstanding debt</p>
              )}
            </div>

            {/* Color */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Color</p>
              <div className="flex gap-3 flex-wrap">
                {walletColors.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-9 h-9 rounded-full transition-all ${color === c ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : ''}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={!name.trim() || isPending}
              className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm disabled:opacity-40 transition-all active:scale-[0.98]">
              {isPending ? 'Saving...' : editWallet ? 'Update Wallet' : 'Create Wallet'}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
