import { ValidationError } from '../../shared/errors';
import { uploadNgoDocument } from '../../shared/storage';
import type { AuthUser } from '../auth/auth.types';
import type { CreateNgoApplicationInput, NgoApplication } from './ngo.types';
import * as repo from './ngo.repository';

export async function submitNgoApplication(params: {
  user: AuthUser;
  input: CreateNgoApplicationInput;
  file?: Express.Multer.File;
}): Promise<NgoApplication> {
  if (!params.file) {
    throw new ValidationError('Баримт бичиг заавал');
  }

  const upload = await uploadNgoDocument({ buffer: params.file.buffer, folder: 'ngo-docs' });
  return await repo.createNgoApplication({
    userId: params.user.id,
    input: params.input,
    documentPublicId: upload.publicId,
    documentResourceType: upload.resourceType === 'raw' ? 'raw' : 'image',
    documentFormat: upload.format,
    documentOriginalName: upload.originalFilename ?? params.file.originalname,
    documentBytes: upload.bytes,
  });
}

