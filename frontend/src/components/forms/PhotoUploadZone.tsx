import type { RefObject } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { listingLabelClass } from './listingFormStyles';

type Props = {
  label: string;
  dropHint: string;
  typesHint: string;
  chooseLabel: string;
  previewUrl: string | null;
  fileName: string | null;
  fileError: string | null;
  fileRef: RefObject<HTMLInputElement | null>;
  onDrop: React.DragEventHandler<HTMLDivElement>;
  onChoose: () => void;
  onFileChange: (file: File | null) => void;
  accept?: string;
  fileMeta?: string | null;
};

export function PhotoUploadZone({
  label,
  dropHint,
  typesHint,
  chooseLabel,
  previewUrl,
  fileName,
  fileError,
  fileRef,
  onDrop,
  onChoose,
  onFileChange,
  accept = 'image/jpeg,image/png',
  fileMeta = null,
}: Props) {
  return (
    <div className="grid gap-1.5">
      <span className={listingLabelClass}>{label}</span>
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-input border border-dashed border-border-input bg-surface-muted px-4 py-5"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="max-h-28 rounded-input object-contain" />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full bg-surface-card text-text-muted">
            <ArrowUp className="size-4" strokeWidth={1.75} aria-hidden />
          </div>
        )}
        <p className="text-center text-xs font-medium text-text-secondary">{dropHint}</p>
        <p className="text-center text-[11px] text-text-muted">{typesHint}</p>
        <Button type="button" variant="secondary" size="sm" onClick={onChoose}>
          {chooseLabel}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            onFileChange(e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
        />
        {fileName ? <p className="max-w-full truncate text-[11px] text-text-muted">{fileName}</p> : null}
        {fileMeta ? <p className="text-[11px] text-text-muted">{fileMeta}</p> : null}
        {fileError ? <p className="text-xs text-danger-text">{fileError}</p> : null}
      </div>
    </div>
  );
}
