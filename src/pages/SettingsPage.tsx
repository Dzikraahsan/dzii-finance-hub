import { Moon, Sun, Bell, Shield, Download, User, ChevronRight, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions, useCategories, useWallets } from '@/hooks/useFinanceData';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: wallets = [] } = useWallets();
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const exportCSV = () => {
    const header = 'Date,Type,Category,Amount,Wallet,Note\n';
    const rows = transactions.map(t => {
      const cat = categories.find(c => c.id === t.category_id);
      const wal = wallets.find(w => w.id === t.wallet_id);
      return `${t.date},${t.type},${cat?.name || ''},${t.amount},${wal?.name || ''},${t.note || ''}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dzii-finance-export-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
  };

  return (
    <div className="px-4 pt-6 space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-foreground">Settings</h1>

      {/* User info */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
          {user?.email?.[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-card-foreground truncate">{user?.email}</p>
          <p className="text-xs text-muted-foreground">Free Plan</p>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-warning" />}
          <div>
            <p className="text-sm font-medium text-card-foreground">Dark Mode</p>
            <p className="text-xs text-muted-foreground">Toggle theme</p>
          </div>
        </div>
        <button onClick={toggleTheme} className={`w-12 h-7 rounded-full transition-colors relative ${darkMode ? 'bg-primary' : 'bg-secondary'}`}>
          <div className={`w-5 h-5 rounded-full bg-primary-foreground absolute top-1 transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Export */}
      <button onClick={exportCSV} className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Download className="w-5 h-5 text-primary" /></div>
        <div className="flex-1">
          <p className="text-sm font-medium text-card-foreground">Export Data</p>
          <p className="text-xs text-muted-foreground">Download as CSV</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Sign Out */}
      <button onClick={handleSignOut} className="w-full bg-card border border-destructive/20 rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform">
        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center"><LogOut className="w-5 h-5 text-destructive" /></div>
        <div className="flex-1">
          <p className="text-sm font-medium text-destructive">Sign Out</p>
          <p className="text-xs text-muted-foreground">Log out of your account</p>
        </div>
      </button>

      <p className="text-center text-xs text-muted-foreground pt-4">Dzii Finance v1.0</p>
    </div>
  );
}