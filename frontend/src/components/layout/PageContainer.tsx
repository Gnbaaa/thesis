import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Props = {
  children: ReactNode;
  className?: string;
  /** Narrower max width for forms and auth */
  variant?: 'default' | 'narrow';
};

export function PageContainer({ children, className, variant = 'default' }: Props) {
  return (
    <div
      className={cn(
        'w-full',
        variant === 'narrow' ? 'max-w-lg' : 'max-w-[1440px]',
        className,
      )}
    >
      {children}
    </div>
  );
}
