import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { controlHeightMd, fieldClasses } from '@/lib/fieldStyles';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { hasError, className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(controlHeightMd, fieldClasses(hasError), className)}
      {...props}
    >
      {children}
    </select>
  );
});
