import { ReactNode } from 'react';
import BottomNav from './BottomNav';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-24 max-w-lg mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
