import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { Moon, Sun, LogOut, Mail, Calendar, Shield } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function ProfileSheet({ open, onOpenChange }: Props) {
  const { user, loading, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [signingOut, setSigningOut] = useState(false);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      toast.success('Signed out');
      onOpenChange(false);
    } catch {
      toast.error('Failed to sign out');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[85vw] max-w-sm border-l border-border bg-background p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-5 pt-6 pb-4">
            <SheetTitle className="text-lg font-bold text-foreground">Profile</SheetTitle>
          </SheetHeader>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-10 h-10 rounded-2xl gradient-primary animate-pulse-glow" />
            </div>
          ) : !user ? (
            <div className="flex-1 flex items-center justify-center px-5">
              <p className="text-sm text-muted-foreground">Could not load profile data.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-5 space-y-5">
              {/* Avatar & Email */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-2xl mb-3">
                  {user.email?.[0]?.toUpperCase() || '?'}
                </div>
                <p className="text-sm font-semibold text-foreground truncate max-w-full">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">Free Plan</p>
              </div>

              {/* Account Info */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</p>
                <div className="bg-card border border-border rounded-2xl divide-y divide-border">
                  <div className="flex items-center gap-3 p-3.5">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm text-card-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Joined</p>
                      <p className="text-sm text-card-foreground">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5">
                    <Shield className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Provider</p>
                      <p className="text-sm text-card-foreground capitalize">{user.app_metadata?.provider || 'email'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="bg-card border border-border rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-warning" />}
                  <span className="text-sm font-medium text-card-foreground">Dark Mode</span>
                </div>
                <button onClick={toggleTheme} className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-primary' : 'bg-secondary'}`}>
                  <div className={`w-4.5 h-4.5 rounded-full bg-primary-foreground absolute top-[3px] transition-transform ${darkMode ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} style={{ width: 18, height: 18 }} />
                </button>
              </div>
            </div>
          )}

          {/* Sign Out */}
          <div className="px-5 pb-6 pt-4">
            <button onClick={handleSignOut} disabled={signingOut}
              className="w-full py-3.5 rounded-xl bg-destructive/10 dark:bg-red-400/10 border border-destructive/20 dark:border-red-400/50 text-destructive dark:text-red-400 font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50">
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
