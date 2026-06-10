import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'surface-card flex flex-col items-center justify-center text-center px-6 py-10 animate-card-enter',
        className,
      )}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <p className="text-h4 text-foreground mb-1">{title}</p>
      {description && (
        <p className="text-caption text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;