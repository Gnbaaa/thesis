import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { focusRing } from '@/lib/fieldStyles';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
};

const variantClass: Record<Variant, string> = {
  primary:
    'border border-transparent bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50',
  secondary:
    'border border-border-input bg-surface-card text-secondary-fg hover:bg-surface-hover disabled:opacity-50',
  ghost: 'border border-transparent bg-transparent text-secondary-fg hover:bg-surface-hover hover:text-text-heading disabled:opacity-50',
};

const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  children,
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-input font-medium transition-colors disabled:pointer-events-none',
        variantClass[variant],
        sizeClass[size],
        fullWidth && 'w-full',
        variant === 'primary' && size === 'md' && 'font-semibold',
        focusRing,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
