jest.mock('../../../src/shared/storage');

import * as storage from '../../../src/shared/storage';
import * as uploadsService from '../../../src/modules/uploads/uploads.service';

const mockStorage = jest.mocked(storage);

describe('uploads.service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uploads image and returns url metadata', async () => {
    mockStorage.uploadImage.mockResolvedValue({
      publicId: 'pets/img-1',
      resourceType: 'image',
      originalFilename: 'pet.jpg',
      format: 'jpg',
      bytes: 2048,
      width: 800,
      height: 600,
    });
    mockStorage.getImageUrl.mockReturnValue('https://cdn.example/pets/img-1.jpg');

    const out = await uploadsService.uploadImage({
      buffer: Buffer.from('jpeg'),
      folder: 'pets',
    });

    expect(out.publicId).toBe('pets/img-1');
    expect(out.url).toContain('cdn.example');
    expect(mockStorage.getImageUrl).toHaveBeenCalledWith('pets/img-1', { width: 800 });
  });

  it('propagates storage upload failures', async () => {
    mockStorage.uploadImage.mockRejectedValue(new Error('Cloudinary timeout'));

    await expect(
      uploadsService.uploadImage({ buffer: Buffer.from('jpeg'), folder: 'pets' }),
    ).rejects.toThrow('Cloudinary timeout');
    expect(mockStorage.getImageUrl).not.toHaveBeenCalled();
  });
});
