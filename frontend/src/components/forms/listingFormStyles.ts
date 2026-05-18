import { cn } from '@/lib/cn';
import { controlHeightSm, fieldClasses, focusRing } from '@/lib/fieldStyles';

export const listingFormCard = 'mt-5 rounded-card border border-border-card bg-surface-card p-5';

export const listingFormStack = 'flex flex-col gap-4';

export const listingFormGrid2 = 'grid grid-cols-1 gap-4 sm:grid-cols-2';

export const listingInputClass = cn(controlHeightSm, fieldClasses(), 'text-sm');

export const listingSelectClass = cn(listingInputClass, 'pr-8');

export const listingTextareaClass = cn(
  'min-h-[88px] w-full resize-y rounded-input border border-border-input bg-surface-card px-3 py-2.5 text-sm text-text placeholder:text-text-muted',
  focusRing,
);

export const listingLabelClass = 'text-xs font-medium text-text-label';

export const listingChoiceClass =
  'flex cursor-pointer items-center gap-2 rounded-input border border-border-input bg-surface-card px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-hover has-[:checked]:border-primary has-[:checked]:bg-success-surface has-[:checked]:text-success-text';

export const listingChoiceRow = 'flex flex-wrap gap-2';

/** Two equal-width choice chips (e.g. sex). */
export const listingChoiceRowSplit = 'grid grid-cols-2 gap-2';

export const listingFormInner = 'flex flex-1 flex-col';

export const listingActionsClass =
  'mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-border-card pt-4';
