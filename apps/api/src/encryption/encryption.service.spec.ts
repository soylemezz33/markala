import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { EncryptionService } from "./encryption.service";

const VALID_KEY = "test-encryption-key-32-chars-abc!";

function withKey(key: string | undefined, fn: () => void) {
  const prev = process.env.ENCRYPTION_KEY;
  if (key === undefined) {
    delete process.env.ENCRYPTION_KEY;
  } else {
    process.env.ENCRYPTION_KEY = key;
  }
  try {
    fn();
  } finally {
    if (prev === undefined) {
      delete process.env.ENCRYPTION_KEY;
    } else {
      process.env.ENCRYPTION_KEY = prev;
    }
  }
}

describe("EncryptionService — constructor", () => {
  it("ENCRYPTION_KEY tanımlı değilse hata fırlatır", () => {
    withKey(undefined, () => {
      expect(() => new EncryptionService()).toThrow("ENCRYPTION_KEY");
    });
  });

  it("ENCRYPTION_KEY 32 karakterden kısaysa hata fırlatır", () => {
    withKey("kisaAnahtar123", () => {
      expect(() => new EncryptionService()).toThrow();
    });
  });

  it("geçerli 32+ karakter anahtar ile başlatılır", () => {
    withKey(VALID_KEY, () => {
      expect(() => new EncryptionService()).not.toThrow();
    });
  });
});

describe("EncryptionService — encrypt / decrypt", () => {
  let svc: EncryptionService;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
    svc = new EncryptionService();
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it("encrypt → decrypt roundtrip düz metni kurtarır", () => {
    const plain = "2FA-secret-TOTP-ABCDEFGH";
    const cipher = svc.encrypt(plain);
    expect(svc.decrypt(cipher)).toBe(plain);
  });

  it("boş string şifrelenip çözülür", () => {
    const cipher = svc.encrypt("");
    expect(svc.decrypt(cipher)).toBe("");
  });

  it("Türkçe karakter ve unicode roundtrip", () => {
    const plain = "Şifreli İçerik: ğüşıöç 🔐";
    expect(svc.decrypt(svc.encrypt(plain))).toBe(plain);
  });

  it("aynı plain text → her şifrelemede farklı output (rastgele IV)", () => {
    const plain = "ayni-metin";
    const c1 = svc.encrypt(plain);
    const c2 = svc.encrypt(plain);
    expect(c1).not.toBe(c2);
    // İkisi de doğru çözülür
    expect(svc.decrypt(c1)).toBe(plain);
    expect(svc.decrypt(c2)).toBe(plain);
  });

  it("şifreli payload 'iv.tag.data' formatındadır (3 nokta ile ayrılmış)", () => {
    const parts = svc.encrypt("test").split(".");
    expect(parts).toHaveLength(3);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it("bozuk format (eksik parça) → hata fırlatır", () => {
    expect(() => svc.decrypt("sadece-bir-parca")).toThrow();
    expect(() => svc.decrypt("iki.parca")).toThrow();
  });

  it("auth tag kurcalanırsa (GCM integrity) → hata fırlatır", () => {
    const cipher = svc.encrypt("hassas-veri");
    const parts = cipher.split(".");
    // Auth tag'i boz
    const tampered = [parts[0], "AAAAAAAAAAAAAAAAAAAAAA==", parts[2]].join(".");
    expect(() => svc.decrypt(tampered)).toThrow();
  });

  it("ciphertext kurcalanırsa → hata fırlatır", () => {
    const cipher = svc.encrypt("hassas-veri");
    const parts = cipher.split(".");
    const tampered = [parts[0], parts[1], "AAAAAAAAAAAAAAAA"].join(".");
    expect(() => svc.decrypt(tampered)).toThrow();
  });
});
