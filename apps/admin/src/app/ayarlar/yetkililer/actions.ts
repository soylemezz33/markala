"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

type Res = { ok: true; message: string } | { ok: false; error: string };

/** E-postadan kullanıcı bulup yetki verir. Kişi kayıtlı değilse API 404 + açıklama döner. */
export async function inviteUser(email: string, role: string): Promise<Res> {
  try {
    const api = await getAdminApi();
    const r = await api.panelUsers.invite(email.trim(), role);
    revalidatePath("/ayarlar/yetkililer");
    return { ok: true, message: r.message ?? `${email} → yetki verildi.` };
  } catch (e) {
    return { ok: false, error: (e as { message?: string })?.message ?? "Yetki verilemedi" };
  }
}

export async function changeRole(id: string, role: string): Promise<Res> {
  try {
    const api = await getAdminApi();
    const r = await api.panelUsers.setRole(id, role);
    revalidatePath("/ayarlar/yetkililer");
    return { ok: true, message: r.message ?? "Rol güncellendi." };
  } catch (e) {
    return { ok: false, error: (e as { message?: string })?.message ?? "Rol değiştirilemedi" };
  }
}
