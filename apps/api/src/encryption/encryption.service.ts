import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";

/**
 * EncryptionService — AES-256-GCM ile simetrik şifreleme.
 *
 * Kullanım: 2FA secret gibi tersine çevrilebilir olması gereken hassas alanlar
 * için. (Parola ve backup kodları gibi tersine çevirme gerekmeyenler bcrypt ile
 * hash'lenir, burada DEĞİL.)
 *
 * Payload formatı: `<iv_b64>.<authTag_b64>.<ciphertext_b64>`
 *  - 12 byte IV (GCM önerisi)
 *  - 16 byte auth tag (tampering tespiti)
 *
 * Anahtar: `ENCRYPTION_KEY` env var (min 32 karakter ASCII). İlk 32 byte
 * kullanılır. Anahtarı rotate etmek için tüm şifreli kolonların yeniden
 * şifrelenmesi gerekir (migration scripti ayrıca yazılmalı).
 */
@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor() {
    const secret = process.env.ENCRYPTION_KEY;
    if (!secret || secret.length < 32) {
      throw new Error(
        "ENCRYPTION_KEY env var tanımlı değil veya 32 karakterden kısa. " +
          "Üretim için: `openssl rand -base64 48` ile üret ve .env'e yaz.",
      );
    }
    this.key = Buffer.from(secret, "utf8").slice(0, 32);
  }

  /** Düz metni şifreler ve `iv.tag.data` formatında base64 dizesi döndürür. */
  encrypt(plain: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(
      ".",
    );
  }

  /** `iv.tag.data` formatındaki payload'u çözüp düz metne çevirir. */
  decrypt(payload: string): string {
    const parts = payload.split(".");
    // Tam 3 parça olmalı; iv ve tag her zaman dolu (12/16 byte). data parçası boş
    // OLABİLİR (boş düz metnin şifreli hâli boş base64'tür) → yalnız varlığını arar.
    if (parts.length !== 3 || !parts[0] || !parts[1]) {
      throw new Error("EncryptionService: geçersiz şifreli payload formatı.");
    }
    const [ivB64, tagB64, dataB64] = parts;
    const decipher = crypto.createDecipheriv("aes-256-gcm", this.key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  }
}
