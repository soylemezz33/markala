"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

/** Admin: kurumsal müşteri ayarlarını (indirim oranı + kredi limiti) müşteri başına günceller. */
export async function updateCorporateSettings(
  id: string,
  data: { corporateDiscount?: number; corporateCreditLimit?: number; corporatePaymentTermDays?: number },
) {
  const api = await getAdminApi();
  await api.adminUsers.updateCorporate(id, data);
  revalidatePath(`/musteriler/${id}`);
}

/** Admin: kurumsal müşterinin cari hesabına tahsilat (ödeme) girer. */
export async function recordCorporatePayment(userId: string, amount: number, description?: string) {
  const api = await getAdminApi();
  await api.corporateLedger.recordPayment(userId, { amount, description });
  revalidatePath(`/musteriler/${userId}`);
}
