import type { TFunction } from 'i18next';
import type { ActivityReportResponse } from './reportsApi';

export type ActivityReportTab = 'donations' | 'pets' | 'volunteer';

const amountFormatter = new Intl.NumberFormat('en-US');

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMnt(value: number): string {
  return `${amountFormatter.format(Math.max(0, Math.round(value)))}₮`;
}

function formatDate(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function petSpeciesLabel(species: string, t: TFunction): string {
  if (species === 'dog') return t('dashboard.reports.pets.species.dog');
  if (species === 'cat') return t('dashboard.reports.pets.species.cat');
  return t('dashboard.reports.pets.species.other');
}

function tableShell(title: string, summary: string, head: string, body: string): string {
  return `
    <section style="margin-bottom: 20px;">
      <h2 style="font-size: 15px; margin: 0 0 8px;">${escapeHtml(title)}</h2>
      <div style="font-size: 12px; line-height: 1.6; margin-bottom: 10px;">${summary}</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background: #f3f4f6;">${head}</tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </section>
  `;
}

function th(label: string): string {
  return `<th style="border: 1px solid #ddd; padding: 6px; text-align: left;">${escapeHtml(label)}</th>`;
}

function td(value: string, align: 'left' | 'right' = 'left'): string {
  return `<td style="border: 1px solid #ddd; padding: 6px; text-align: ${align};">${escapeHtml(value)}</td>`;
}

function buildDonationsSection(data: ActivityReportResponse, t: TFunction): string {
  const d = data.donations;
  const summary = [
    `${t('dashboard.reports.donations.cards.totalCollected')}: ${formatMnt(d.totalCollected)}`,
    `${t('dashboard.reports.donations.cards.successCount')}: ${d.successCount}`,
  ].join('<br />');

  const head = [
    th(t('dashboard.reports.donations.cols.date')),
    th(t('dashboard.reports.donations.cols.post')),
    th(t('dashboard.reports.donations.cols.amount')),
    th(t('dashboard.reports.donations.cols.status')),
    th(t('dashboard.reports.donations.cols.ref')),
  ].join('');

  const body =
    d.transactions.length === 0
      ? `<tr><td colspan="5" style="border: 1px solid #ddd; padding: 8px; text-align: center;">${escapeHtml(t('dashboard.reports.donations.empty'))}</td></tr>`
      : d.transactions
          .map(
            (tx) =>
              `<tr>${td(formatDate(tx.createdAt))}${td(tx.postTitle)}${td(formatMnt(tx.amount), 'right')}${td(t(`dashboard.reports.donations.status.${tx.status}`))}${td(tx.stripePaymentIntentId ?? '—')}</tr>`,
          )
          .join('');

  return tableShell(t('dashboard.reports.tabs.donations'), summary, head, body);
}

function buildPetsSection(data: ActivityReportResponse, t: TFunction): string {
  const p = data.pets;
  const summary = [
    `${t('dashboard.reports.pets.cards.total')}: ${p.totalCount}`,
    `${t('dashboard.reports.pets.cards.available')}: ${p.byStatus.available}`,
    `${t('dashboard.reports.pets.cards.pending')}: ${p.byStatus.pending}`,
    `${t('dashboard.reports.pets.cards.adopted')}: ${p.byStatus.adopted}`,
  ].join('<br />');

  const head = [
    th(t('dashboard.reports.pets.cols.name')),
    th(t('dashboard.reports.pets.cols.species')),
    th(t('dashboard.reports.pets.cols.status')),
    th(t('dashboard.reports.pets.cols.date')),
  ].join('');

  const body =
    p.recent.length === 0
      ? `<tr><td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: center;">${escapeHtml(t('dashboard.reports.pets.empty'))}</td></tr>`
      : p.recent
          .map(
            (pet) =>
              `<tr>${td(pet.name)}${td(petSpeciesLabel(pet.species, t))}${td(t(`dashboard.reports.pets.status.${pet.status}`))}${td(formatDate(pet.createdAt))}</tr>`,
          )
          .join('');

  return tableShell(t('dashboard.reports.tabs.pets'), summary, head, body);
}

function buildVolunteerSection(data: ActivityReportResponse, t: TFunction): string {
  const v = data.volunteer;
  const summary = [
    `${t('dashboard.reports.volunteer.cards.total')}: ${v.totalPosts}`,
    `${t('dashboard.reports.volunteer.cards.active')}: ${v.activeCount}`,
    `${t('dashboard.reports.volunteer.cards.registrations')}: ${v.totalRegistrations}`,
  ].join('<br />');

  const head = [
    th(t('dashboard.reports.volunteer.cols.title')),
    th(t('dashboard.reports.volunteer.cols.location')),
    th(t('dashboard.reports.volunteer.cols.eventDate')),
    th(t('dashboard.reports.volunteer.cols.registered')),
    th(t('dashboard.reports.volunteer.cols.status')),
  ].join('');

  const body =
    v.recent.length === 0
      ? `<tr><td colspan="5" style="border: 1px solid #ddd; padding: 8px; text-align: center;">${escapeHtml(t('dashboard.reports.volunteer.empty'))}</td></tr>`
      : v.recent
          .map(
            (post) =>
              `<tr>${td(post.title)}${td(post.location)}${td(formatDate(post.eventDate))}${td(t('dashboard.reports.volunteer.registeredOfRequired', { registered: post.registeredCount, required: post.requiredCount }))}${td(t(`dashboard.reports.volunteer.status.${post.status}`))}</tr>`,
          )
          .join('');

  return tableShell(t('dashboard.reports.tabs.volunteer'), summary, head, body);
}

function buildReportBody(
  tab: ActivityReportTab,
  data: ActivityReportResponse,
  t: TFunction,
  from: string,
  to: string,
): string {
  const section =
    tab === 'donations'
      ? buildDonationsSection(data, t)
      : tab === 'pets'
        ? buildPetsSection(data, t)
        : buildVolunteerSection(data, t);

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #111111; background: #ffffff; padding: 8px;">
      <h1 style="font-size: 20px; margin: 0 0 6px;">${escapeHtml(t('dashboard.reports.title'))}</h1>
      <p style="font-size: 12px; color: #555555; margin: 0 0 18px;">
        ${escapeHtml(t('dashboard.reports.exportRange', { from, to }))}
      </p>
      ${section}
    </div>
  `;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createPdfRenderRoot(htmlBody: string): Promise<{
  root: HTMLElement;
  cleanup: () => void;
}> {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'pdf-export');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '794px',
    height: '1123px',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
    zIndex: '-1',
  });

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error('PDF iframe unavailable');
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="mn">
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; padding: 24px; background: #ffffff; color: #111111; }
      * { box-sizing: border-box; }
    </style>
  </head>
  <body>${htmlBody}</body>
</html>`);
  doc.close();

  await wait(150);

  const root = doc.body;
  if (!root || root.childElementCount === 0) {
    document.body.removeChild(iframe);
    throw new Error('PDF content empty');
  }

  return {
    root,
    cleanup: () => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    },
  };
}

export async function exportActivityReportPdf(params: {
  tab: ActivityReportTab;
  data: ActivityReportResponse;
  from: string;
  to: string;
  t: TFunction;
}): Promise<void> {
  const htmlBody = buildReportBody(params.tab, params.data, params.t, params.from, params.to);
  const { root, cleanup } = await createPdfRenderRoot(htmlBody);

  try {
    const mod = await import('html2pdf.js');
    const html2pdf = mod.default ?? mod;

    await html2pdf()
      .set({
        margin: 10,
        filename: `activity-report-${params.tab}-${params.from}_${params.to}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(root)
      .save();
  } finally {
    cleanup();
  }
}

export function defaultExportDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
