import type { InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

type Props = {
  label: string;
  error?: string;
  id: string;
  icon?: LucideIcon;
} & InputHTMLAttributes<HTMLInputElement>;

export function AuthFormField({ label, error, id, icon: Icon, className, ...inputProps }: Props) {
  const hasError = Boolean(error);

  const inputClassName = cn(
    'h-11 w-full rounded-lg border bg-surface-card text-base text-text outline-none transition-[border-color,outline-color] placeholder:text-text-muted',
    Icon ? 'pl-10 pr-3' : 'px-3',
    hasError
      ? 'border-red-600 focus-visible:border-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:border-red-500 dark:focus-visible:border-red-500 dark:focus-visible:outline-red-500'
      : 'border-border-input focus-visible:border-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
    className,
  );

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text-label">
        {label}
      </label>
      {Icon ? (
        <div className="relative">
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-text-muted"
            aria-hidden
            strokeWidth={1.75}
          />
          <input
            id={id}
            className={inputClassName}
            aria-invalid={hasError}
            aria-describedby={error ? `${id}-err` : undefined}
            {...inputProps}
          />
        </div>
      ) : (
        <input
          id={id}
          className={inputClassName}
          aria-invalid={hasError}
          aria-describedby={error ? `${id}-err` : undefined}
          {...inputProps}
        />
      )}
      {error ? (
        <p id={`${id}-err`} className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
