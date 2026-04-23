/**
 * Shared UI primitives — built from design tokens in `src/index.css` (@theme).
 * Prefer these + token utilities (`bg-primary`, `text-text-heading`, …) over raw hex in components.
 */

export const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring';

/** Focus ring on dark auth panel (light outline). */
export const focusRingOnAuthPanel =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-auth-panel';

export const btnPrimary =
  'inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary text-base font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50';

export const btnSecondary =
  'inline-flex h-12 w-full items-center justify-center rounded-lg border border-border-input bg-surface-card text-[15px] font-medium text-secondary-fg transition-colors hover:bg-surface-hover';

export const linkMuted =
  'text-sm font-medium text-secondary-fg transition-colors hover:text-text-heading';

export const linkSubtle =
  'text-[13px] text-subtle-fg transition-colors hover:text-text-secondary';

/** Inline alert for form / API errors */
export const alertError =
  'rounded-md border border-danger-border bg-danger-surface px-3 py-2.5 text-sm text-danger-text';
