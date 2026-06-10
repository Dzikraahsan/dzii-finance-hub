import { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 pt-1">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-caption uppercase tracking-[0.18em] text-muted-foreground font-medium mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="text-h2 text-foreground truncate">{title}</h1>
        {description && (
          <p className="text-caption text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}