"use server";

import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

type Res = { ok: true; message: string } | { ok: false; error: string };

const SAYFA = "/ayarlar/yetkililer";

function hata(e: unknown, varsayilan: string): Res {
  return { ok: false, error: (e as { message?: string })?.message ?? varsayilan };
}

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
    revalidatePath(SAYFA);
    const promoted = (r as { promoted?: boolean }).promoted;
    return {
      ok: true,
      message: promoted
        ? `${r.email} zaten kayıtlıydı, şifresine dokunulmadan yetkisi verildi (${r.role}).`
        : `${r.email} oluşturuldu (${r.role}).`,
    };
  } catch (e) {
    return hata(e, "Kullanıcı oluşturulamadı");
  }
}

/** Mevcut (siteden üye olmuş) bir kullanıcıya yetki verir. */
export async function inviteUser(email: string, role: string): Promise<Res> {
  try {
    const api = await getAdminApi();
    const r = await api.panelUsers.invite(email.trim(), role);
    revalidatePath(SAYFA);
    return { ok: true, message: r.message ?? `${email} → yetki verildi.` };
  } catch (e) {
    return hata(e, "Yetki verilemedi");
  }
}

export async function changeRole(id: string, role: string): Promise<Res> {
  try {
    const api = await getAdminApi();
    const r = await api.panelUsers.setRole(id, role);
    revalidatePath(SAYFA);
    return { ok: true, message: r.message ?? "Rol güncellendi." };
  } catch (e) {
    return hata(e, "Rol değiştirilemedi");
  }
}

/** Ad / e-posta düzenleme (2026-09-17). */
export async function updatePanelUser(id: string, data: { fullName?: string; email?: string }): Promise<Res> {
  try {
    const api = await getAdminApi();
    const r = await api.panelUsers.update(id, {
      fullName: data.fullName?.trim() || undefined,
      email: data.email?.trim() || undefined,
    });
    revalidatePath(SAYFA);
    return { ok: true, message: r.unchanged ? (r.message ?? "Değişiklik yok.") : `${r.email} güncellendi.` };
  } catch (e) {
    return hata(e, "Kullanıcı güncellenemedi");
  }
}

/** Şifre sıfırlama: yeni şifreyi süper admin belirler; kişinin tüm oturumları kapanır. */
export async function resetPanelUserPassword(id: string, password: string): Promise<Res> {
  try {
    const api = await getAdminApi();
    const r = await api.panelUsers.resetPassword(id, password);
    revalidatePath(SAYFA);
    return { ok: true, message: `${r.email} için yeni şifre tanımlandı; açık oturumları kapatıldı.` };
  } catch (e) {
    return hata(e, "Şifre sıfırlanamadı");
  }
}

/** Hesap silme; sipariş geçmişi varsa API hesabı silmez, yalnız panel yetkisini kaldırır. */
export async function deletePanelUser(id: string): Promise<Res> {
  try {
    const api = await getAdminApi();
    const r = await api.panelUsers.remove(id);
    revalidatePath(SAYFA);
    return { ok: true, message: r.message };
  } catch (e) {
    return hata(e, "Hesap silinemedi");
  }
}

/** Rol izin setini kaydeder (2026-09-17). Varsayılanla aynıysa API kaydı siler. */
export async function saveRolePerms(rol: string, izinler: string[]): Promise<Res> {
  try {
    const api = await getAdminApi();
    const r = await api.panelUsers.saveRole(rol, izinler);
    revalidatePath(SAYFA);
    return {
      ok: true,
      message: r.ozellestirilmis
        ? `${rol} izinleri kaydedildi (${r.izinler.length} izin).`
        : `${rol} izinleri varsayılana eşit; özel kayıt kaldırıldı.`,
    };
  } catch (e) {
    return hata(e, "İzinler kaydedilemedi");
  }
}

export async function resetRolePerms(rol: string): Promise<Res> {
  try {
    const api = await getAdminApi();
    await api.panelUsers.resetRole(rol);
    revalidatePath(SAYFA);
    return { ok: true, message: `${rol} izinleri varsayılana döndürüldü.` };
  } catch (e) {
    return hata(e, "İzinler sıfırlanamadı");
  }
}
