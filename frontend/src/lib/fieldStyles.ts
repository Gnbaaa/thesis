/** Shared field / control class strings for inputs and legacy uiClasses exports. */

export const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring';

export const focusRingOnAuthPanel =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-auth-panel';

export const fieldBase =
  'w-full rounded-input border bg-surface-card text-base text-text outline-none transition-[border-color] placeholder:text-text-muted';

export const fieldBorderDefault = 'border-border-input focus-visible:border-text-secondary';

export const fieldBorderError =
  'border-danger-text focus-visible:border-danger-text focus-visible:outline-danger-text';

export function fieldClasses(hasError?: boolean, withIconPadding?: boolean) {
  const parts = [fieldBase, hasError ? fieldBorderError : fieldBorderDefault, focusRing];
  if (withIconPadding) parts.push('pl-10 pr-3');
  else parts.push('px-3');
  return parts.join(' ');
}

export const controlHeightMd = 'h-11';
export const controlHeightSm = 'h-9';
