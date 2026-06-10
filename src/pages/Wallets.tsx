import { useWallets, useDeleteWallet } from '@/hooks/useFinanceData';
import { formatCurrency } from '@/lib/format';
import { Plus, CreditCard, Pencil, Trash2, Wallet as WalletIcon } from 'lucide-react';
import { useState } from 'react';
import AddWalletSheet from '@/components/AddWalletSheet';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/ui/empty-state';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function Wallets() {
  const { data: wallets = [] } = useWallets();
  const deleteWallet = useDeleteWallet();
  const total = wallets.reduce((s, w) => s + Number(w.balance), 0);
  const [showAdd, setShowAdd] = useState(false);
  const [editWallet, setEditWallet] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteWallet.mutateAsync(deletingId);
      toast.success('Wallet deleted');
    } catch { toast.error('Cannot delete wallet with transactions'); }
    setDeletingId(null);
  };

  return (
    <div className="px-4 pt-6 space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="Accounts"
        title="Wallets"
        description="All your money, in one place"
        action={
          <button onClick={() => { setEditWallet(null); setShowAdd(true); }}
            aria-label="Add wallet"
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center btn-press shadow-md">
            <Plus className="w-4 h-4" />
          </button>
        }
      />
      <div className="relative rounded-2xl gradient-primary text-primary-foreground p-5 text-center overflow-hidden glow-primary animate-card-enter">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" aria-hidden />
        <p className="text-caption opacity-80 mb-1 relative">Total Balance</p>
        <p className="text-3xl font-bold tracking-tight font-display animate-number relative">{formatCurrency(total)}</p>
        <div className="flex items-center justify-center gap-1.5 mt-2 opacity-80 relative">
          <CreditCard className="w-3.5 h-3.5" />
          <span className="text-caption">{wallets.length} {wallets.length === 1 ? 'wallet' : 'wallets'}</span>
        </div>
      </div>
      {wallets.length === 0 ? (
        <EmptyState
          icon={<WalletIcon className="w-6 h-6" />}
          title="No wallets yet"
          description="Add cash, bank, or e-wallet accounts to start tracking your balance."
          action={
            <button onClick={() => setShowAdd(true)} className="h-10 px-4 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold btn-press shadow-md">
              Add wallet
            </button>
          }
        />
      ) : (
      <div className="space-y-3">
        {wallets.map((wallet, i) => (
          <div key={wallet.id} className={`surface-card p-4 flex items-center gap-3 card-interactive animate-list-item stagger-${Math.min(i + 1, 10)}`}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: wallet.color + '20' }}>{wallet.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-card-foreground truncate">{wallet.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {wallet.type.replace('-', ' ')}{(wallet as any).provider ? ` · ${(wallet as any).provider}` : ''}
              </p>
            </div>
            <p className="text-sm font-semibold text-card-foreground shrink-0">{formatCurrency(Number(wallet.balance))}</p>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => { setEditWallet(wallet); setShowAdd(true); }}
                className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Pencil className="w-3 h-3 text-primary dark:!text-[hsl(var(--accent-text))]" />
              </button>
              <button onClick={() => setDeletingId(wallet.id)}
                className="w-7 h-7 rounded-lg bg-destructive/10 dark:!bg-red-400/10 flex items-center justify-center">
                <Trash2 className="w-3 h-3 text-destructive dark:!text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      <AddWalletSheet open={showAdd} onOpenChange={setShowAdd} editWallet={editWallet} />
      <AlertDialog open={!!deletingId} onOpenChange={v => { if (!v) setDeletingId(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Wallet</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this wallet. Transactions linked to it may be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
