import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'muted' | 'success' | 'warning' | 'danger' | 'accent';

type Props = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

const variantClass: Record<Variant, string> = {
  muted: 'border border-border-card bg-badge-muted-bg text-badge-muted-fg',
  success: 'border border-success-border bg-success-surface text-success-text font-semibold',
  warning: 'border border-warning-border bg-warning-surface text-warning-text font-semibold',
  danger: 'border border-danger-border bg-danger-surface text-danger-text font-semibold',
  accent: 'border border-primary/25 bg-success-surface text-success-text font-semibold',
};

export function Badge({ children, variant = 'muted', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-input px-2 py-0.5 text-xs font-medium',
        variantClass[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
