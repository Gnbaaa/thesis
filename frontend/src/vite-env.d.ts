/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'html2pdf.js' {
  const html2pdf: () => {
    set: (options: Record<string, unknown>) => {
      from: (element: HTMLElement) => { save: () => Promise<void> };
    };
  };
  export default html2pdf;
}
