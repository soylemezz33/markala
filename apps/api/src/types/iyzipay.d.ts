/**
 * iyzipay-node resmi SDK'sı tip tanımı içermiyor; kullandığımız yüzeyi burada bildiriyoruz.
 * skipLibCheck açık + bu ambient declaration → `import Iyzipay from "iyzipay"` tip-güvenli derlenir.
 */
declare module "iyzipay" {
  interface IyzipayOptions {
    apiKey: string;
    secretKey: string;
    uri: string;
  }
  type IyzipayCallback = (err: unknown, result: any) => void;

  class Iyzipay {
    constructor(options: IyzipayOptions);
    checkoutFormInitialize: { create(request: unknown, cb: IyzipayCallback): void };
    checkoutForm: { retrieve(request: unknown, cb: IyzipayCallback): void };

    static LOCALE: { TR: string; EN: string };
    static CURRENCY: { TRY: string; USD: string; EUR: string };
    static PAYMENT_GROUP: { PRODUCT: string; LISTING: string; SUBSCRIPTION: string };
    static BASKET_ITEM_TYPE: { PHYSICAL: string; VIRTUAL: string };
  }
  export = Iyzipay;
}
