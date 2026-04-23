import type { AuthUser } from '../modules/auth/auth.types';

declare global {
  namespace Express {
    // Passport uses Express.User for req.user typing.
    // Augment it to include our AuthUser fields.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AuthUser {}
  }
}

export {};

