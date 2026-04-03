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
        <nav className="glass border-t border-border px-2 pt-1 pb-1">
          <div className="max-w-lg mx-auto relative flex items-center">

            {/* LEFT */}
            <div className="flex flex-1 justify-around">
              {leftTabs.map(({ path, icon: Icon, label }) => {
                const active = location.pathname === path;
                return (
                  <NavLink
                    key={path}
                    to={path}
                    className={`nav-tab flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg min-w-[40px] ${
                      active ? "text-primary nav-tab-active" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5 icon-transition" />
                    <span className="text-[9px] font-medium">{label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* SPACER (buat ruang FAB) */}
            <div className="w-12" />

            {/* RIGHT */}
            <div className="flex flex-1 justify-around">
              {rightTabs.map(({ path, icon: Icon, label }) => {
                const active = location.pathname === path;
                return (
                  <NavLink
                    key={path}
                    to={path}
                    className={`nav-tab flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg min-w-[40px] ${
                      active ? "text-primary nav-tab-active" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5 icon-transition" />
                    <span className="text-[9px] font-medium">{label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* FAB CENTER */}
            <button
              onClick={() => setShowAdd(true)}
              className="absolute left-1/2 -translate-x-1/2 -top-1 w-11 h-11 rounded-full gradient-primary flex items-center justify-center shadow-lg"
            >
              <Plus className="w-5 h-5 text-primary-foreground" />
            </button>

          </div>
        </nav>
      </div>

      <AddTransactionSheet open={showAdd} onOpenChange={setShowAdd} />
    </>
  );
}
