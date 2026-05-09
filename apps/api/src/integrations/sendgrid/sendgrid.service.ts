import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * SendGrid transactional mail entegrasyonu — STUB.
 *
 * FAZ 4'te @sendgrid/mail SDK ile değiştirilecek.
 * Yerel geliştirmede MailHog kullanılır (docker-compose'da var, port 8025'te UI).
 */

export type MailTemplate =
  | "order-confirmation"
  | "design-approval-request"
  | "shipped"
  | "delivered"
  | "review-request"
  | "password-reset"
  | "welcome";

@Injectable()
export class SendgridService {
  private readonly logger = new Logger(SendgridService.name);
  constructor(private config: ConfigService) {}

  async send(input: {
    to: string;
    template: MailTemplate;
    data: Record<string, unknown>;
  }): Promise<{ messageId: string }> {
    this.logger.warn(`[STUB] Mail sent: ${input.template} → ${input.to}`);
    return { messageId: `msg_${Date.now()}` };
  }
}
