import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-card border border-dashed border-border-card bg-surface-card px-6 py-10',
        className,
      )}
    >
      <p className="font-serif text-lg font-semibold text-text-heading">{title}</p>
      {description ? <p className="max-w-md text-sm text-text-secondary">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
