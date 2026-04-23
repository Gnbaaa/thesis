import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <section className="w-full max-w-lg rounded-card border border-border-card bg-surface-card px-8 py-10 shadow-sm dark:shadow-none sm:px-10 sm:py-11">
      <h1 className="text-2xl font-semibold leading-snug tracking-tight text-text-heading">{t('home.title')}</h1>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-text-secondary">{t('home.subtitle')}</p>
    </section>
  );
}
