import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { focusRingOnAuthPanel } from '@/lib/uiClasses';

type Props = {
  backTo: string;
  backLabel: string;
  panelTitle: string;
  tips: string[];
  icon: LucideIcon;
  children: ReactNode;
};

export function ListingFormShell({
  backTo,
  backLabel,
  panelTitle,
  tips,
  icon: Icon,
  children,
}: Props) {
  return (
    <div className="mx-auto w-full max-w-[920px] overflow-hidden rounded-shell border border-border-card bg-surface-card shadow-sm">
      <div className="flex flex-col lg:min-h-[min(640px,calc(100vh-10rem))] lg:flex-row">
        <aside className="flex flex-col gap-6 border-b border-border-card bg-auth-panel px-6 py-7 sm:px-8 lg:w-[36%] lg:shrink-0 lg:border-b-0 lg:border-r lg:py-8">
          <div>
            <Link
              to={backTo}
              className={cn(
                'inline-flex text-sm font-medium text-accent hover:text-accent-hover',
                focusRingOnAuthPanel,
                'rounded-input',
              )}
            >
              {backLabel}
            </Link>
            <div className="mt-5 flex size-11 items-center justify-center rounded-input border border-on-auth-panel/15 bg-on-auth-panel/10 text-on-auth-panel">
              <Icon className="size-5" strokeWidth={1.75} aria-hidden />
            </div>
            <h2 className="mt-4 font-serif text-lg font-semibold leading-snug tracking-tight text-on-auth-panel">
              {panelTitle}
            </h2>
          </div>
          <ul className="space-y-3">
            {tips.map((tip) => (
              <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-on-auth-panel-muted">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2} aria-hidden />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex flex-1 flex-col px-6 py-7 sm:px-8 lg:py-8">
          <div className="flex flex-1 flex-col">{children}</div>
        </div>
      </div>
    </div>
  );
}
