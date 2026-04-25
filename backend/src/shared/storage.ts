import { v2 as cloudinary } from 'cloudinary';
import { ExternalServiceError, ValidationError } from './errors';

export type UploadResult = {
  publicId: string;
  resourceType: 'image' | 'video' | 'raw';
  originalFilename?: string;
  format?: string;
  bytes: number;
  width?: number;
  height?: number;
};

function ensureCloudinaryConfigured(): void {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new ExternalServiceError('Cloudinary тохируулаагүй байна', 'CLOUDINARY_NOT_CONFIGURED');
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

function sniffImageType(buf: Buffer): 'jpg' | 'png' | 'gif' | 'webp' | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
    return 'png';
  // GIF: GIF87a/GIF89a
  if (buf.toString('ascii', 0, 6) === 'GIF87a' || buf.toString('ascii', 0, 6) === 'GIF89a') return 'gif';
  // WebP: RIFF....WEBP
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

function isPdf(buf: Buffer): boolean {
  // PDF: 25 50 44 46 2D  => "%PDF-"
  return buf.length >= 5 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46 && buf[4] === 0x2d;
}

export async function uploadImage(params: { buffer: Buffer; folder: string }): Promise<UploadResult> {
  ensureCloudinaryConfigured();

  const type = sniffImageType(params.buffer);
  if (!type) {
    throw new ValidationError('Зураг файл буруу байна (JPG/PNG/GIF/WEBP)');
  }

  const dataUri = `data:image/${type};base64,${params.buffer.toString('base64')}`;
  const res = await cloudinary.uploader.upload(dataUri, {
    folder: params.folder,
    resource_type: 'image',
  });

  return {
    publicId: res.public_id,
    resourceType: 'image',
    originalFilename: res.original_filename,
    format: res.format,
    bytes: res.bytes,
    width: res.width,
    height: res.height,
  };
}

export async function uploadNgoDocument(params: { buffer: Buffer; folder: string }): Promise<UploadResult> {
  ensureCloudinaryConfigured();

  const imgType = sniffImageType(params.buffer);
  if (imgType) {
    const dataUri = `data:image/${imgType};base64,${params.buffer.toString('base64')}`;
    const res = await cloudinary.uploader.upload(dataUri, {
      folder: params.folder,
      resource_type: 'image',
    });
    return {
      publicId: res.public_id,
      resourceType: 'image',
      originalFilename: res.original_filename,
      format: res.format,
      bytes: res.bytes,
      width: res.width,
      height: res.height,
    };
  }

  if (isPdf(params.buffer)) {
    const dataUri = `data:application/pdf;base64,${params.buffer.toString('base64')}`;
    const res = await cloudinary.uploader.upload(dataUri, {
      folder: params.folder,
      resource_type: 'raw',
    });
    return {
      publicId: res.public_id,
      resourceType: 'raw',
      originalFilename: res.original_filename,
      format: res.format,
      bytes: res.bytes,
    };
  }

  throw new ValidationError('Баримт бичиг буруу байна (PDF эсвэл зураг)');
}

export function getImageUrl(publicId: string, opts?: { width?: number }): string {
  ensureCloudinaryConfigured();
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: 'image',
    transformation: [
      { fetch_format: 'auto', quality: 'auto' },
      ...(opts?.width ? [{ width: opts.width, crop: 'limit' }] : []),
    ],
  });
}

export function getRawUrl(publicId: string): string {
  ensureCloudinaryConfigured();
  return cloudinary.url(publicId, { secure: true, resource_type: 'raw' });
}

export async function remove(publicId: string): Promise<void> {
  ensureCloudinaryConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

