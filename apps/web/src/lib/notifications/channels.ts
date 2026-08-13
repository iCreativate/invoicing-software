import type { NotificationChannel } from './types';
import { isResendConfigured, isWhatsappEnvReady } from '@/lib/integrations/messaging';

/**
 * Abstraction for outbound customer communications.
 * Providers are configured via env; callers should not hard-code Resend/Twilio.
 */
export type { NotificationChannel };

export type SendMessageInput = {
  channel: NotificationChannel;
  to: string;
  subject?: string;
  body: string;
  html?: string;
  meta?: Record<string, unknown>;
};

export type SendMessageResult = {
  ok: boolean;
  channel: NotificationChannel;
  providerMessageId?: string;
  error?: string;
};

export function getMessagingStatus() {
  return {
    resend: isResendConfigured(),
    whatsapp: isWhatsappEnvReady(),
  };
}
