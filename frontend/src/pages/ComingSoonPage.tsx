import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';

export default function ComingSoonPage() {
  const { t } = useTranslation();
  return (
    <section className="flex w-full max-w-md flex-col items-center gap-5 rounded-card border border-border-card bg-surface-card px-8 py-12 text-center shadow-sm dark:shadow-none sm:px-10">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-surface-hover text-text-muted"
        aria-hidden
      >
        <Clock className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">{t('common.comingSoon')}</p>
    </section>
  );
}
