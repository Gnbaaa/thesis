import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Props = {
  children: ReactNode;
  /** Minimum width before horizontal scroll appears. */
  minWidth?: number;
  className?: string;
};

export function ScrollTable({ children, minWidth = 640, className }: Props) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="w-full" style={{ minWidth: `${minWidth}px` }}>
        {children}
      </div>
    </div>
  );
}
