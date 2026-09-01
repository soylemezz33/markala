"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

type Res = { ok: true; message: string } | { ok: false; error: string };

/**
 * Panelden yetkili hesabı oluşturur (e-posta + şifre). 2026-08-21 Hasan kararı:
 * kişi siteden üye olmasın, hesabı yönetici tanımlasın.
 * E-posta zaten kayıtlıysa API 409 + açıklama döner (şifre ezilmez).
 */
export async function createPanelUser(
  email: string,
  password: string,
  role: string,
  fullName?: string,
): Promise<Res> {
  try {
    const api = await getAdminApi();
    const r = await api.panelUsers.create({ email: email.trim(), password, role, fullName });
    revalidatePath("/ayarlar/yetkililer");
    const promoted = (r as { promoted?: boolean }).promoted;
    return {
      ok: true,
      message: promoted
        ? `${r.email} zaten kayıtlıydı, şifresine dokunulmadan yetkisi verildi (${r.role}).`
        : `${r.email} oluşturuldu (${r.role}).`,
    };
  } catch (e) {
    return { ok: false, error: (e as { message?: string })?.message ?? "Kullanıcı oluşturulamadı" };
  }
}

/** Mevcut (siteden üye olmuş) bir kullanıcıya yetki verir. */
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
