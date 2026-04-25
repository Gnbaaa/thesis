import { getPool } from '../../infra/db/pool';
import type { CreateNgoApplicationInput, NgoApplication } from './ngo.types';

export async function createNgoApplication(params: {
  userId: string;
  input: CreateNgoApplicationInput;
  documentPublicId: string;
  documentResourceType: 'image' | 'raw';
  documentFormat?: string;
  documentOriginalName?: string;
  documentBytes?: number;
}): Promise<NgoApplication> {
  const pool = getPool();
  const q = `
    INSERT INTO ngo_applications (
      user_id, org_name, reg_number, org_address, activity_direction,
      contact_phone, contact_email, description, document_public_id,
      document_resource_type, document_format,
      document_original_name, document_bytes
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING
      id,
      user_id as "userId",
      org_name as "orgName",
      reg_number as "regNumber",
      org_address as "orgAddress",
      activity_direction as "activityDirection",
      contact_phone as "contactPhone",
      contact_email as "contactEmail",
      description,
      document_public_id as "documentPublicId",
      document_resource_type as "documentResourceType",
      document_format as "documentFormat",
      document_original_name as "documentOriginalName",
      document_bytes as "documentBytes",
      submitted_at as "submittedAt",
      status
  `;

  const values = [
    params.userId,
    params.input.orgName,
    params.input.regNumber,
    params.input.orgAddress,
    params.input.activityDirection,
    params.input.contactPhone,
    params.input.contactEmail,
    params.input.description ?? '',
    params.documentPublicId,
    params.documentResourceType,
    params.documentFormat ?? null,
    params.documentOriginalName ?? null,
    params.documentBytes ?? null,
  ];

  const res = await pool.query<NgoApplication>(q, values);
  return res.rows[0];
}

