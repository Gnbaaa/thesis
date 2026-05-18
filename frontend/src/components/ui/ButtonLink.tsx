import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { btnPrimary, btnSecondary, focusRing } from '@/lib/uiClasses';

type Variant = 'primary' | 'secondary';

type Props = LinkProps & {
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

const variantClass: Record<Variant, string> = {
  primary: btnPrimary,
  secondary: btnSecondary,
};

/** Router Link styled as a button; overrides global anchor accent color. */
export function ButtonLink({ variant = 'primary', className, children, ...props }: Props) {
  return (
    <Link
      className={cn(
        variantClass[variant],
        focusRing,
        'no-underline hover:no-underline',
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
