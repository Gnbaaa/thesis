import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { focusRing } from '@/lib/fieldStyles';

type Props = {
  backTo: string;
  backLabel: string;
};

export function ListingFormHeader({ backTo, backLabel }: Props) {
  return (
    <Link
      to={backTo}
      className={cn(
        'inline-flex text-sm font-medium text-accent hover:text-accent-hover',
        focusRing,
        'rounded-input',
      )}
    >
      {backLabel}
    </Link>
  );
}
