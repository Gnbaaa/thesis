import { z } from 'zod';

const orgName = z.string().min(2, 'Байгууллагын нэр заавал').max(200, 'Байгууллагын нэр хэт урт байна');
const regNumber = z
  .string()
  .min(2, 'Регистрийн дугаар заавал')
  .max(50, 'Регистрийн дугаар хэт урт байна');
const orgAddress = z.string().min(2, 'Хаяг заавал').max(300, 'Хаяг хэт урт байна');
const activityDirection = z.string().min(2, 'Үйл ажиллагааны чиглэл заавал').max(300, 'Чиглэл хэт урт байна');
const phone = z.string().min(6, 'Утасны дугаар буруу байна').max(32, 'Утасны дугаар хэт урт байна');
const email = z.string().email('И-мэйл буруу байна').max(254, 'И-мэйл хэт урт байна');

export const createNgoApplicationBody = z.object({
  orgName,
  regNumber,
  orgAddress,
  activityDirection,
  contactPhone: phone,
  contactEmail: email,
  description: z.string().max(2000, 'Тайлбар хэт урт байна').optional().default(''),
});

