import type { EmailResult, EmailService } from './types';
import type { UserProfile } from '../../domain/types';

/** v1: no server, so no email goes out. The app shows an in-app confirmation instead. */
export class NoopEmailService implements EmailService {
  async sendAccountConfirmation(_user: UserProfile): Promise<EmailResult> {
    return { sent: false, reason: 'no-backend' };
  }
}
