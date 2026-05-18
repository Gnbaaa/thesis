import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { fieldClasses } from '@/lib/fieldStyles';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { hasError, className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn('min-h-[100px] resize-y py-2.5', fieldClasses(hasError), className)}
      {...props}
    />
  );
});
