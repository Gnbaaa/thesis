import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type MaxWidth = 'sm' | 'form' | 'md' | 'lg' | 'xl' | '2xl';

const maxWidthClass: Record<MaxWidth, string> = {
  sm: 'max-w-[640px]',
  form: 'max-w-[520px]',
  md: 'max-w-[720px]',
  lg: 'max-w-[880px]',
  xl: 'max-w-[1100px]',
  '2xl': 'max-w-[1280px]',
};

type Props = {
  children: ReactNode;
  className?: string;
  /** Content max width; always horizontally centered in the layout. */
  maxWidth?: MaxWidth;
};

export function CenteredPage({ children, className, maxWidth = 'lg' }: Props) {
  return (
    <section className={cn('mx-auto w-full', maxWidthClass[maxWidth], className)}>
      {children}
    </section>
  );
}
