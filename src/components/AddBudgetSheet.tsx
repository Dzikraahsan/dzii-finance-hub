import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCategories, useAddBudget } from '@/hooks/useFinanceData';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editBudget?: { id: string; category_id: string; amount: number; month: string } | null;
}

export default function AddBudgetSheet({ open, onOpenChange, editBudget }: Props) {
  const { data: categories = [] } = useCategories();
  const addBudget = useAddBudget();
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const currentMonth = new Date().toISOString().slice(0, 7);

  const expenseCategories = categories.filter(c => c.type === 'expense');

  useEffect(() => {
    if (editBudget) {
      setCategoryId(editBudget.category_id);
      setAmount(String(editBudget.amount));
    } else {
      setCategoryId('');
      setAmount('');
    }
  }, [editBudget, open]);

  const handleSubmit = async () => {
    const amt = Number(amount);
    if (!amt || !categoryId) return;
    try {
      await addBudget.mutateAsync({ category_id: categoryId, amount: amt, month: currentMonth });
      toast.success(editBudget ? 'Budget updated!' : 'Budget created!');
      onOpenChange(false);
      setCategoryId('');
      setAmount('');
    } catch {
      toast.error('Failed to save budget');
    }
  };

  const handleAmountKey = (key: string) => {
    if (key === 'del') setAmount(prev => prev.slice(0, -1));
    else if (key === '.' && amount.includes('.')) return;
    else setAmount(prev => prev + key);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-t border-border p-0 bg-background max-h-[85vh]">
        <div className="flex flex-col overflow-y-auto max-h-[85vh]">
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle className="text-lg font-bold">{editBudget ? 'Edit Budget' : 'Add Budget'}</SheetTitle>
          </SheetHeader>

          {/* Amount */}
          <div className="text-center px-5 mb-4">
            <p className="text-muted-foreground text-xs mb-1">Monthly Budget</p>
            <p className="balance-number text-foreground">{amount ? `Rp ${Number(amount).toLocaleString('id-ID')}` : 'Rp 0'}</p>
          </div>

          {/* Category */}
          <div className="px-5 mb-4">
            <p className="text-xs text-muted-foreground mb-2">Category</p>
            <div className="grid grid-cols-4 gap-2">
              {expenseCategories.map(c => (
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
              disabled={!amount || !categoryId || addBudget.isPending}
              className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm disabled:opacity-40 transition-all active:scale-[0.98]">
              {addBudget.isPending ? 'Saving...' : editBudget ? 'Update Budget' : 'Save Budget'}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
