import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, HandHeart, Heart, PawPrint, Users } from 'lucide-react';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { useIsLoggedIn } from '@/lib/authSession';
import { cn } from '@/lib/cn';
import { focusRing } from '@/lib/uiClasses';

const iconStroke = 1.75;

function FeatureCard({
  icon,
  title,
  description,
  to,
  linkLabel,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  to: string;
  linkLabel: string;
}) {
  return (
    <article className="flex flex-col rounded-card border border-border-card bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
      <div className="mb-4 inline-flex size-11 items-center justify-center rounded-input bg-surface-muted text-accent">
        {icon}
      </div>
      <h3 className="font-serif text-lg font-semibold text-text-heading sm:text-xl">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary sm:text-base">{description}</p>
      <Link
        to={to}
        className={cn(
          'mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-hover',
          focusRing,
        )}
      >
        {linkLabel}
        <ArrowRight className="size-4" strokeWidth={iconStroke} aria-hidden />
      </Link>
    </article>
  );
}

function StepItem({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <li className="flex gap-4">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-card bg-surface-muted font-serif text-sm font-semibold text-accent"
        aria-hidden
      >
        {step}
      </span>
      <div>
        <h3 className="font-semibold text-text-heading">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">{description}</p>
      </div>
    </li>
  );
}

export default function LandingPage() {
  const { t } = useTranslation();
  const loggedIn = useIsLoggedIn();

  return (
    <div className="w-full">
      <section className="relative overflow-hidden rounded-shell border border-border-card bg-auth-panel px-6 py-14 text-on-auth-panel sm:px-10 sm:py-16 lg:px-14 lg:py-20">
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-on-auth-panel/5 sm:size-80"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-on-auth-panel/15 bg-on-auth-panel/10 px-3 py-1 text-xs font-medium text-on-auth-panel-muted sm:text-sm">
            <PawPrint className="size-3.5" strokeWidth={iconStroke} aria-hidden />
            {t('landing.hero.badge')}
          </p>
          <h1 className="mt-6 whitespace-pre-line font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            {t('home.title')}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-on-auth-panel-muted sm:text-lg">
            {t('landing.hero.subtitle')}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink to="/pets" className="w-full px-8 sm:w-auto">
              {t('landing.hero.ctaBrowse')}
            </ButtonLink>
            {loggedIn ? (
              <ButtonLink
                to="/dashboard"
                variant="secondary"
                className="w-full border-on-auth-panel/20 bg-on-auth-panel/10 px-8 text-on-auth-panel hover:bg-on-auth-panel/15 sm:w-auto"
              >
                {t('landing.hero.ctaDashboard')}
              </ButtonLink>
            ) : (
              <>
                <ButtonLink
                  to="/register"
                  variant="secondary"
                  className="w-full border-on-auth-panel/20 bg-on-auth-panel/10 px-8 text-on-auth-panel hover:bg-on-auth-panel/15 sm:w-auto"
                >
                  {t('landing.hero.ctaRegister')}
                </ButtonLink>
                <Link
                  to="/login"
                  className={cn(
                    'inline-flex h-11 w-full items-center justify-center rounded-input px-6 text-[15px] font-medium text-on-auth-panel-muted transition-colors hover:text-on-auth-panel sm:w-auto',
                    focusRing,
                  )}
                >
                  {t('landing.hero.ctaLogin')}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mt-14 sm:mt-16 lg:mt-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <FeatureCard
            icon={<Heart className="size-5" strokeWidth={iconStroke} aria-hidden />}
            title={t('landing.features.adopt.title')}
            description={t('landing.features.adopt.description')}
            to="/pets"
            linkLabel={t('landing.features.adopt.link')}
          />
          <FeatureCard
            icon={<HandHeart className="size-5" strokeWidth={iconStroke} aria-hidden />}
            title={t('landing.features.donate.title')}
            description={t('landing.features.donate.description')}
            to="/donations"
            linkLabel={t('landing.features.donate.link')}
          />
          <FeatureCard
            icon={<Users className="size-5" strokeWidth={iconStroke} aria-hidden />}
            title={t('landing.features.volunteer.title')}
            description={t('landing.features.volunteer.description')}
            to="/volunteer"
            linkLabel={t('landing.features.volunteer.link')}
          />
        </div>
      </section>

      <section
        className="mt-14 rounded-shell border border-border-card bg-surface-muted px-6 py-10 sm:mt-16 sm:px-10 sm:py-12 lg:mt-20"
        aria-labelledby="landing-steps-title"
      >
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div>
            <h2 id="landing-steps-title" className="font-serif text-2xl font-semibold text-text-heading sm:text-3xl">
              {t('landing.steps.title')}
            </h2>
            <p className="mt-3 text-sm text-text-secondary sm:text-base">{t('landing.steps.subtitle')}</p>
          </div>
          <ol className="space-y-6">
            <StepItem step="1" title={t('landing.steps.one.title')} description={t('landing.steps.one.description')} />
            <StepItem step="2" title={t('landing.steps.two.title')} description={t('landing.steps.two.description')} />
            <StepItem step="3" title={t('landing.steps.three.title')} description={t('landing.steps.three.description')} />
          </ol>
        </div>
      </section>
    </div>
  );
}
