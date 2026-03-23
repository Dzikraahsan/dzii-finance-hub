import { Moon, Sun, Bell, Shield, Download, User, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const items = [
    { icon: User, label: 'Profile', desc: 'Manage your account' },
    { icon: Shield, label: 'PIN Lock', desc: 'Set up app security' },
    { icon: Bell, label: 'Notifications', desc: 'Manage alerts' },
    { icon: Download, label: 'Export Data', desc: 'Download as CSV' },
  ];

  return (
    <div className="px-4 pt-6 space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-foreground">Settings</h1>

      {/* Theme Toggle */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-warning" />}
          <div>
            <p className="text-sm font-medium text-card-foreground">Dark Mode</p>
            <p className="text-xs text-muted-foreground">Toggle theme appearance</p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className={`w-12 h-7 rounded-full transition-colors relative ${darkMode ? 'bg-primary' : 'bg-secondary'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-primary-foreground absolute top-1 transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        {items.map(({ icon: Icon, label, desc }) => (
          <button key={label} className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-card-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground pt-4">Dzii Finance v1.0</p>
    </div>
  );
}
