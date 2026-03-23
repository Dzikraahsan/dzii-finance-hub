import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, PieChart, Target, Wallet, Settings, Plus } from 'lucide-react';
import { useState } from 'react';
import AddTransactionSheet from './AddTransactionSheet';

const tabs = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { path: '/analytics', icon: PieChart, label: 'Analytics' },
  { path: '/budget', icon: Target, label: 'Budget' },
  { path: '/wallets', icon: Wallet, label: 'Wallets' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
        {/* FAB */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => setShowAdd(true)}
            className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-lg animate-pulse-glow transition-transform active:scale-95"
          >
            <Plus className="w-6 h-6 text-primary-foreground" />
          </button>
        </div>

        <nav className="glass border-t border-border px-2 pt-2 pb-1">
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {tabs.map(({ path, icon: Icon, label }) => {
              const active = location.pathname === path;
              return (
                <NavLink
                  key={path}
                  to={path}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[48px] ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]' : ''}`} />
                  <span className="text-[10px] font-medium">{label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>

      <AddTransactionSheet open={showAdd} onOpenChange={setShowAdd} />
    </>
  );
}
