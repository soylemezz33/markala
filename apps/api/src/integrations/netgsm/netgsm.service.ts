import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * NetGSM SMS entegrasyonu — STUB.
 * FAZ 4'te NetGSM XML/REST API ile sipariş bildirimleri gönderilecek.
 */
@Injectable()
export class NetgsmService {
  private readonly logger = new Logger(NetgsmService.name);
  constructor(private config: ConfigService) {}

  async sendSms(input: { to: string; message: string; messageHeader?: string }): Promise<{ jobId: string }> {
    this.logger.warn(`[STUB] SMS to ${input.to}: ${input.message.slice(0, 60)}...`);
    return { jobId: `sms_${Date.now()}` };
  }

  async sendOtp(input: { to: string; code: string }): Promise<{ jobId: string }> {
    return this.sendSms({
      to: input.to,
      message: `Markala doğrulama kodunuz: ${input.code}. Bu kod kimseyle paylaşılmamalıdır.`,
    });
  }
}
