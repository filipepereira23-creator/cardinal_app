import { NoopEmailService } from './noop';
import type { EmailService } from './types';

// Swap for a backend-backed implementation once one exists (see ./types.ts).
export const email: EmailService = new NoopEmailService();
export type { EmailService, EmailResult } from './types';
