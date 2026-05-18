import type { InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/Input';

type Props = {
  label: string;
  error?: string;
  id: string;
  icon?: LucideIcon;
} & InputHTMLAttributes<HTMLInputElement>;

export function AuthFormField({ label, error, id, icon, className, ...inputProps }: Props) {
  const hasError = Boolean(error);

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text-label">
        {label}
      </label>
      <Input
        id={id}
        icon={icon}
        hasError={hasError}
        className={className}
        aria-invalid={hasError}
        aria-describedby={error ? `${id}-err` : undefined}
        {...inputProps}
      />
      {error ? (
        <p id={`${id}-err`} className="text-sm text-danger-text" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
