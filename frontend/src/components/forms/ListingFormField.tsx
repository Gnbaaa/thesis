import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { listingLabelClass } from './listingFormStyles';

type Props = {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function ListingFormField({ label, error, children, className }: Props) {
  return (
    <label className={cn('grid gap-1.5', className)}>
      <span className={listingLabelClass}>{label}</span>
      {children}
      {error ? <span className="text-xs text-danger-text">{error}</span> : null}
    </label>
  );
}
