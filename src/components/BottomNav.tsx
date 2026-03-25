import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, PieChart, Target, Wallet, Settings, Plus } from 'lucide-react';
import { useState } from 'react';
import AddTransactionSheet from './AddTransactionSheet';

const tabs = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Txns' },
  { path: '/analytics', icon: PieChart, label: 'Stats' },
  { path: '/budget', icon: Target, label: 'Budget' },
  { path: '/wallets', icon: Wallet, label: 'Wallets' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();
  const [showAdd, setShowAdd] = useState(false);

  // Split tabs: first 3 left, last 3 right, FAB in center
  const leftTabs = tabs.slice(0, 3);
  const rightTabs = tabs.slice(3);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
        <nav className="glass border-t border-border px-1 pt-1 pb-1">
          <div className="flex items-center justify-around max-w-lg mx-auto relative">
            {leftTabs.map(({ path, icon: Icon, label }) => {
              const active = location.pathname === path;
              return (
                <NavLink key={path} to={path}
                  className={`flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg transition-colors min-w-[40px] ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Icon className={`w-5 h-5 ${active ? 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]' : ''}`} />
                  <span className="text-[9px] font-medium">{label}</span>
                </NavLink>
              );
            })}

            {/* FAB */}
            <button
              onClick={() => setShowAdd(true)}
              className="w-12 h-12 -mt-5 rounded-full gradient-primary flex items-center justify-center shadow-lg transition-transform active:scale-90"
            >
              <Plus className="w-5 h-5 text-primary-foreground" />
            </button>

            {rightTabs.map(({ path, icon: Icon, label }) => {
              const active = location.pathname === path;
              return (
                <NavLink key={path} to={path}
                  className={`flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg transition-colors min-w-[40px] ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Icon className={`w-5 h-5 ${active ? 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]' : ''}`} />
                  <span className="text-[9px] font-medium">{label}</span>
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