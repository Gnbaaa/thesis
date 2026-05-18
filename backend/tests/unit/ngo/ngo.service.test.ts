jest.mock('../../../src/modules/ngo/ngo.repository');
jest.mock('../../../src/shared/storage');

import * as repo from '../../../src/modules/ngo/ngo.repository';
import * as storage from '../../../src/shared/storage';
import * as ngoService from '../../../src/modules/ngo/ngo.service';
import { ValidationError } from '../../../src/shared/errors';
import { mockAuthUser } from '../../helpers/mockUser';

const mockRepo = jest.mocked(repo);
const mockStorage = jest.mocked(storage);

describe('ngo.service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requires document file', async () => {
    await expect(
      ngoService.submitNgoApplication({
        user: mockAuthUser(),
        input: {
          orgName: 'Test NGO',
          registrationNumber: '123',
          address: 'UB',
          contactEmail: 'ngo@example.com',
          contactPhone: '99001122',
          description: 'We help animals',
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('uploads document and creates application', async () => {
    mockStorage.uploadNgoDocument.mockResolvedValue({
      publicId: 'ngo/doc-1',
      resourceType: 'image',
      originalFilename: 'license.pdf',
      format: 'pdf',
      bytes: 1000,
      width: 100,
      height: 100,
    });
    mockRepo.createNgoApplication.mockResolvedValue({
      id: 'app-1',
      userId: 'user-1',
      orgName: 'Test NGO',
      status: 'pending',
    } as never);

    const file = {
      buffer: Buffer.from('pdf'),
      originalname: 'license.pdf',
    } as Express.Multer.File;

    const out = await ngoService.submitNgoApplication({
      user: mockAuthUser(),
      input: {
        orgName: 'Test NGO',
        registrationNumber: '123',
        address: 'UB',
        contactEmail: 'ngo@example.com',
        contactPhone: '99001122',
        description: 'We help animals',
      },
      file,
    });

    expect(out.id).toBe('app-1');
    expect(mockStorage.uploadNgoDocument).toHaveBeenCalled();
    expect(mockRepo.createNgoApplication).toHaveBeenCalledWith(
      expect.objectContaining({ documentPublicId: 'ngo/doc-1' }),
    );
  });

  it('stores raw resource type for pdf uploads', async () => {
    mockStorage.uploadNgoDocument.mockResolvedValue({
      publicId: 'ngo/doc-2',
      resourceType: 'raw',
      originalFilename: 'license.pdf',
      format: 'pdf',
      bytes: 1000,
      width: undefined,
      height: undefined,
    });
    mockRepo.createNgoApplication.mockResolvedValue({ id: 'app-2' } as never);

    await ngoService.submitNgoApplication({
      user: mockAuthUser(),
      input: {
        orgName: 'Test NGO',
        registrationNumber: '123',
        address: 'UB',
        contactEmail: 'ngo@example.com',
        contactPhone: '99001122',
        description: 'We help animals',
      },
      file: { buffer: Buffer.from('pdf'), originalname: 'license.pdf' } as Express.Multer.File,
    });

    expect(mockRepo.createNgoApplication).toHaveBeenCalledWith(
      expect.objectContaining({ documentResourceType: 'raw' }),
    );
  });
});
