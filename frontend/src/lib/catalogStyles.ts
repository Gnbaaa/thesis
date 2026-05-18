/** Shared browse/list page controls (pets, volunteer, donations). */

import { focusRing } from './fieldStyles';

export const catalogSearch =
  'h-9 w-full rounded-input border border-border-input bg-surface-card px-3 text-sm text-text placeholder:text-text-muted';

export const catalogSearchRow = 'flex flex-col gap-3 sm:flex-row sm:items-center';

export const catalogSearchGrow = `${catalogSearch} sm:min-w-0 sm:flex-1`;

export const catalogSelect =
  'h-9 min-w-[6.25rem] cursor-pointer appearance-none rounded-input border border-border-input bg-surface-card bg-[length:0.65rem] bg-[right_0.55rem_center] bg-no-repeat px-3 pr-8 text-sm text-text [background-image:var(--select-chevron)]';

export const catalogBtnDisabled =
  'h-9 cursor-not-allowed rounded-input border border-border-input bg-surface-hover px-3.5 text-sm text-text-muted';

export const catalogFocus = focusRing;

export const catalogCard =
  'w-full overflow-hidden rounded-card border border-border-card bg-surface-card transition-colors hover:border-primary/30';

export const catalogCardMedia =
  'catalog-card-media relative h-28 w-full overflow-hidden bg-surface-muted text-xs text-text-muted sm:h-32';

/** Slight top bias keeps pet faces visible when the thumbnail crops. */
export const catalogCardImage =
  'absolute inset-0 size-full object-cover object-[center_25%]';

export const catalogCardMediaEmpty =
  'absolute inset-0 flex items-center justify-center';

export const catalogCardLink =
  'mt-2 inline-flex h-9 w-full items-center justify-center rounded-input border border-border-input bg-surface-card text-sm font-medium text-text-secondary transition-colors hover:border-primary/40 hover:bg-surface-hover hover:text-text-heading';

export const catalogPageBtn =
  'inline-flex size-9 items-center justify-center rounded-input border border-border-input bg-surface-card text-sm text-text-secondary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40';

export const catalogPageBtnActive =
  'inline-flex size-9 items-center justify-center rounded-input border border-transparent bg-primary text-sm font-medium text-on-primary';

export const catalogProgressTrack = 'h-1.5 w-full overflow-hidden rounded-input bg-surface-muted';

export const catalogProgressFill = 'h-full rounded-input bg-primary transition-[width]';
