import { Router, type Request, type Response, type NextFunction } from 'express';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import { getDotenvDiagnostics } from '../../loadEnv';
import { ensureGoogleOAuthReady } from './oauth.adapter';
import { issueTokenPair } from './auth.jwt';
import type { AuthUser } from './auth.types';
import { assertUserMayAuthenticate } from './userStatus';
import { AppError } from '../../shared/errors';
import * as ctrl from './auth.controller';
import * as schemas from './auth.schema';
import { validateBody } from '../../shared/validate';
import { authRequired } from '../../shared/auth';

const router = Router();

function frontendBaseUrl(): string {
  return (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '');
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, validateBody(schemas.registerBody), ctrl.register);
router.post('/login', authLimiter, validateBody(schemas.loginBody), ctrl.login);
router.post('/refresh', authLimiter, validateBody(schemas.refreshBody), ctrl.refresh);
router.post('/forgot-password', authLimiter, validateBody(schemas.forgotPasswordBody), ctrl.forgotPassword);
router.post('/reset-password', authLimiter, validateBody(schemas.resetPasswordBody), ctrl.resetPassword);
router.get('/me', authRequired, ctrl.me);

router.get('/google', (req: Request, res: Response, next: NextFunction) => {
  if (!ensureGoogleOAuthReady()) {
    const body: Record<string, unknown> = {
      message:
        'Google-ээр нэвтрэх тохируулаагүй байна. GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_CALLBACK_URL шалгана уу.',
    };
    if (process.env.NODE_ENV !== 'production') {
      const diag = getDotenvDiagnostics();
      body.debug = {
        ...diag,
        googleIdLen: process.env.GOOGLE_OAUTH_CLIENT_ID?.length ?? 0,
        secretLen: process.env.GOOGLE_OAUTH_CLIENT_SECRET?.length ?? 0,
        hasCallback: Boolean(process.env.GOOGLE_OAUTH_CALLBACK_URL?.trim()),
        hint: 'Backend-ийг backend/ хавтсаас npm run dev асаана уу.',
      };
    }
    res.status(503).json(body);
    return;
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get(
  '/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    if (!ensureGoogleOAuthReady()) {
      res.status(503).json({ message: 'Google OAuth идэвхгүй байна.' });
      return;
    }
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${frontendBaseUrl()}/login?error=google`,
    })(req, res, next);
  },
  (req: Request, res: Response) => {
    const user = req.user as AuthUser | undefined;
    if (!user) {
      res.redirect(`${frontendBaseUrl()}/login?error=google`);
      return;
    }
    try {
      assertUserMayAuthenticate(user.status);
    } catch (err) {
      if (err instanceof AppError && err.code === 'USER_SUSPENDED') {
        res.redirect(`${frontendBaseUrl()}/login?reason=account_suspended`);
        return;
      }
      if (err instanceof AppError && err.code === 'USER_ACCOUNT_CLOSED') {
        res.redirect(`${frontendBaseUrl()}/login?reason=account_closed`);
        return;
      }
      res.redirect(`${frontendBaseUrl()}/login?error=google`);
      return;
    }
    const { accessToken, refreshToken } = issueTokenPair(user);
    const hash = new URLSearchParams({
      accessToken,
      refreshToken,
    }).toString();
    res.redirect(`${frontendBaseUrl()}/auth/callback#${hash}`);
  },
);

export { router as authRouter };
