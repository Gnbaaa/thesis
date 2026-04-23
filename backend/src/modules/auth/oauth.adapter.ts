import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { logger } from '../../shared/logger';
import * as authService from './auth.service';

let googleStrategyRegistered = false;

function readGoogleEnv(): { clientID: string; clientSecret: string; callbackURL: string } | null {
  const clientID = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const callbackURL = process.env.GOOGLE_OAUTH_CALLBACK_URL?.trim();
  if (!clientID || !clientSecret || !callbackURL) {
    return null;
  }
  return { clientID, clientSecret, callbackURL };
}

/** Дуудах бүрт одоогийн process.env-ийг шалгана (модуль ачаалах мөчийн хуулбар биш). */
export function googleOAuthIsConfigured(): boolean {
  return readGoogleEnv() !== null;
}

/** Strategy бүртгэж, одоогоор Google OAuth бэлэн эсэхийг нэг дуудлагаар буцаана. */
export function ensureGoogleOAuthReady(): boolean {
  registerGoogleStrategyIfNeeded();
  return googleOAuthIsConfigured();
}

/** Passport strategy-г нэг л удаа бүртгэнэ; .env дараа ачаалагдсан ч ажиллана. */
export function registerGoogleStrategyIfNeeded(): void {
  if (googleStrategyRegistered) {
    return;
  }
  const cfg = readGoogleEnv();
  if (!cfg) {
    return;
  }
  passport.use(
    new GoogleStrategy(
      {
        clientID: cfg.clientID,
        clientSecret: cfg.clientSecret,
        callbackURL: cfg.callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            done(new Error('Google did not return an email'));
            return;
          }
          const avatarUrl = profile.photos?.[0]?.value ?? null;
          const user = await authService.upsertGoogleUser({
            googleId: profile.id,
            email,
            firstName: profile.name?.givenName ?? '',
            lastName: profile.name?.familyName ?? '',
            avatarUrl,
          });
          done(null, user);
        } catch (err) {
          logger.error({ err }, 'oauth.google.verify_failed');
          done(err as Error);
        }
      },
    ),
  );
  googleStrategyRegistered = true;
}
