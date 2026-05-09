import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * iyzico ödeme entegrasyonu — STUB.
 *
 * FAZ 4'te bu modül gerçek iyzipay-node SDK'sı ile değiştirilecek:
 * https://github.com/iyzico/iyzipay-node
 *
 * Şu an her zaman başarılı ödeme döner — checkout flow'u test edebilmek için.
 */
@Injectable()
export class IyzicoService {
  private readonly logger = new Logger(IyzicoService.name);

  constructor(private config: ConfigService) {}

  async initiate3DSecure(input: {
    orderId: string;
    amount: number;
    cardHolderName: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvc: string;
    installments?: number;
  }): Promise<{ paymentId: string; htmlContent: string; status: "success" | "failure" }> {
    this.logger.warn(`[STUB] iyzico 3D Secure: order=${input.orderId} amount=${input.amount}`);
    return {
      paymentId: `mock_${Date.now()}`,
      htmlContent: `<p>Mock 3D Secure iframe — gerçek implementasyon FAZ 4'te.</p>`,
      status: "success",
    };
  }

  async getInstallments(binNumber: string, amount: number): Promise<Array<{ count: number; total: number }>> {
    this.logger.warn(`[STUB] iyzico installments lookup: bin=${binNumber}`);
    // BIN bilgisine göre dinamik taksit listesi — burada statik 1/3/6/9
    return [
      { count: 1, total: amount },
      { count: 3, total: amount * 1.02 },
      { count: 6, total: amount * 1.05 },
      { count: 9, total: amount * 1.09 },
    ];
  }

  async refund(paymentId: string, amount?: number): Promise<{ refundId: string; status: "success" | "failure" }> {
    this.logger.warn(`[STUB] iyzico refund: payment=${paymentId} amount=${amount ?? "full"}`);
    return { refundId: `refund_${Date.now()}`, status: "success" };
  }
}
