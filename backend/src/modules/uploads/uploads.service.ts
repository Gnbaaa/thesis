import * as storage from '../../shared/storage';

export async function uploadImage(params: { buffer: Buffer; folder: string }) {
  const uploaded = await storage.uploadImage({ buffer: params.buffer, folder: params.folder });
  return {
    publicId: uploaded.publicId,
    url: storage.getImageUrl(uploaded.publicId, { width: 800 }),
    bytes: uploaded.bytes,
    width: uploaded.width,
    height: uploaded.height,
  };
}

