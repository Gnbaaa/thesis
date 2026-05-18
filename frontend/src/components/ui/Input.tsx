import { forwardRef, type InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { controlHeightMd, fieldClasses } from '@/lib/fieldStyles';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
  icon?: LucideIcon;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { hasError, icon: Icon, className, ...props },
  ref,
) {
  const inputClass = cn(controlHeightMd, fieldClasses(hasError, Boolean(Icon)), className);

  if (Icon) {
    return (
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-text-muted"
          aria-hidden
          strokeWidth={1.75}
        />
        <input ref={ref} className={inputClass} {...props} />
      </div>
    );
  }

  return <input ref={ref} className={inputClass} {...props} />;
});
