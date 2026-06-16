import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface DeletePayload {
  email?: string;
  password?: string;
  confirmText?: string;
  /** opsiyonel — e-postaya gönderilen tek seferlik token (FAZ 3'te aktif olacak) */
  confirmToken?: string;
}

/**
 * KVKK 11/e + GDPR Madde 17 — Silme hakkı (Right to Erasure).
 * Kullanıcı hesabını soft-delete eder.
 *
 * Şu an mock — prod'da:
 *   1. session check (NextAuth)
 *   2. parola doğrulama (argon2.verify)
 *   3. confirm token kontrolü (e-posta ile gönderilen JWT)
 *   4. prisma.user.update({
 *        where: { id }, data: { deletedAt: new Date(), status: "PENDING_DELETION" }
 *      })
 *   5. ilgili kayıtları 30 gün sonra fiziksel silmek üzere kuyruğa al
 *   6. siparişler/faturalar → anonimleştir (VUK 213 = 10 yıl saklama zorunluluğu)
 *   7. SendGrid → kullanıcıya 30 gün geri alma penceresi onayı
 *   8. audit log: { event: "ACCOUNT_DELETION_REQUESTED", userId, ip, ua }
 */
export async function POST(req: NextRequest) {
  let body: DeletePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { email, password, confirmText, confirmToken } = body;

  // Mock session check — prod'da NextAuth getServerSession
  // const session = await getServerSession(authOptions);
  // if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Geçersiz e-posta." },
      { status: 400 },
    );
  }

  if (confirmText !== "HESABIMI SİL") {
    return NextResponse.json(
      { error: "Onay metni hatalı. \"HESABIMI SİL\" yazmalısınız." },
      { status: 400 },
    );
  }

  if (!password || password.length < 4) {
    return NextResponse.json(
      { error: "Parolanızı girin." },
      { status: 400 },
    );
  }

  // Mock parola doğrulama — prod'da argon2.verify(user.passwordHash, password)
  // const valid = await argon2.verify(user.passwordHash, password);
  // if (!valid) return NextResponse.json({ error: "Parola hatalı." }, { status: 401 });

  // Confirm token kontrolü (opsiyonel — e-posta confirmation flow için)
  if (confirmToken) {
    // TODO: prod'da
    //   const decoded = jwt.verify(confirmToken, process.env.JWT_SECRET);
    //   if (decoded.email !== email) return 403
    //   if (decoded.purpose !== "account_deletion") return 403
    // Token içeriği loglanmaz
    console.log("[hesap-sil] confirm token present (mock pass)");
  }

  // Mock soft-delete
  const deletedAt = new Date().toISOString();
  const purgeScheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  // E-posta loglanmaz; audit log prod'da DB'ye yazılmalı
  console.log(`[hesap-sil] soft delete: deletedAt=${deletedAt} purgeScheduledAt=${purgeScheduledAt}`);

  // TODO: prod'da
  //   await prisma.user.update({
  //     where: { email },
  //     data: {
  //       deletedAt: new Date(),
  //       status: "PENDING_DELETION",
  //       email: `deleted-${user.id}@markala.deleted`,  // PII temizleme
  //     },
  //   });
  //   await prisma.order.updateMany({
  //     where: { userId: user.id },
  //     data: { customerName: "ANONIM", customerEmail: null }, // VUK için sipariş kalır
  //   });
  //   await sendgrid.send({ to: email, subject: "Hesap silme talebiniz alındı", ... });
  //   await auditLog.create({ event: "ACCOUNT_DELETION", userId: user.id, ip, ua });

  return NextResponse.json({
    ok: true,
    deletedAt,
    purgeScheduledAt,
    message:
      "Hesabınız silinme sürecine alındı. 30 gün içinde tüm kişisel verileriniz sistemlerimizden temizlenecek. Sipariş ve fatura kayıtları VUK 213 gereği anonimleştirilmiş olarak korunacaktır.",
  });
}
