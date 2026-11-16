/**
 * ─── TRANSACTIONAL EMAIL (future) ──────────────────────────────────────────
 *
 * A static site (GitHub Pages) can't send email: sending needs a server that
 * holds a mail-provider secret. So v1 shows an in-app confirmation screen and
 * the call below is a no-op that reports `sent: false`.
 *
 * When the backend arrives (see src/storage/adapter.ts):
 *   1. Implement `EmailService`, ideally as a call to your own API route or a
 *      backend function (Supabase Edge Function, Firebase Function, AWS Lambda)
 *      that talks to Postmark / Resend / SendGrid / Amazon SES.
 *      Never put a mail-provider API key in this front-end code.
 *   2. For a real "confirm your email" step, the backend creates a signed,
 *      expiring token, emails a link like  https://<site>/#/verify/<token>,
 *      and marks the user verified when the link is opened.
 *      (Supabase Auth and Firebase Auth do all of this out of the box.)
 *   3. Swap the export in ./index.ts.
 * Sending from an @cardinal… address also needs that domain, with SPF/DKIM/DMARC set up.
 */
import type { UserProfile } from '../../domain/types';

export interface EmailResult {
  sent: boolean;
  /** Why nothing was sent, when sent is false. */
  reason?: 'no-backend' | 'error';
}

export interface EmailService {
  sendAccountConfirmation(user: UserProfile): Promise<EmailResult>;
}
