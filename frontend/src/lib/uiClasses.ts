/**
 * Shared UI primitives — built from design tokens in `src/index.css`.
 * Prefer `components/ui/*` for new code; these strings keep existing pages working.
 */

export { focusRing, focusRingOnAuthPanel } from './fieldStyles';

export const btnPrimary =
  'inline-flex h-11 w-full items-center justify-center rounded-input border border-transparent bg-primary text-base font-semibold text-on-primary no-underline transition-colors hover:bg-primary-hover hover:text-on-primary disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring';

export const btnSecondary =
  'inline-flex h-11 w-full items-center justify-center rounded-input border border-border-input bg-surface-card text-[15px] font-medium text-secondary-fg transition-colors hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring';

export const btnSmallSecondary =
  'inline-flex h-9 items-center justify-center rounded-input border border-border-input bg-surface-card px-3 text-sm font-medium text-secondary-fg transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring';

export const linkMuted =
  'text-sm font-medium text-secondary-fg transition-colors hover:text-accent hover:no-underline';

export const linkSubtle =
  'text-sm text-subtle-fg transition-colors hover:text-accent hover:no-underline';

export const alertError =
  'rounded-input border border-danger-border bg-danger-surface px-3 py-2.5 text-sm text-danger-text';
