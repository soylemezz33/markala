"use client";

import { useState, useTransition } from "react";
import type { PanelRolMatrisiDto, PanelUserDto } from "@markala/api-client";
import { AdminShell } from "@/components/admin-shell";
import { confirm } from "@/components/confirm-dialog";
import { ShieldCheck, UserPlus, Info, PencilSimple, Key, Trash, ArrowsClockwise, Check, X } from "@phosphor-icons/react";
import { createPanelUser, changeRole, updatePanelUser, resetPanelUserPassword, deletePanelUser } from "./actions";
import { RolYetkileri } from "./rol-yetkileri";

export const ROLE_LABEL: Record<string, string> = {
  super_admin: "Süper Admin",
  admin: "Admin",
  tasarimci: "Grafik Tasarım",
  kargo: "Kargo",
  muhasebe: "Muhasebe",
  customer: "Yetkisiz (müşteri)",
};

const ROLE_DESC: Record<string, string> = {
  super_admin: "Her şeye erişir; yetkili ekler, rol ve izinleri düzenler.",
  admin: "Varsayılan olarak her şeye erişir; yetkili yönetimi hariç. İzinleri aşağıdaki matristen daraltılabilir.",
  tasarimci: "Sipariş içeriği, dosyalar, müşteri iletişimi, görsel/slider/banner, yorumlar ve içerik. İzinleri matristen ayarlanır.",
  kargo: "Siparişi paketleyip gönderiyi açar; takip numarası girer. Tutar, maliyet, ödeme ve fatura görmez. İzinleri matristen ayarlanır.",
  muhasebe: "Para akışı, fatura/Paraşüt, cari, fiyat güncelleme. İzinleri matristen ayarlanır.",
  customer: "Panel erişimi kaldırılır.",
};

const INPUT = "px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm";
const BTN_KUCUK = "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium disabled:opacity-60";

type Msg = { ok: boolean; text: string } | null;

/** 12 karakter; büyük+küçük+rakam garantili (API kuralıyla aynı). Karışan karakterler (0/O, 1/l) dışarıda. */
function rastgeleSifre(): string {
  const buyuk = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const kucuk = "abcdefghijkmnpqrstuvwxyz";
  const rakam = "23456789";
  const hepsi = buyuk + kucuk + rakam;
  const sec = (set: string) => set[crypto.getRandomValues(new Uint32Array(1))[0]! % set.length]!;
  const parcalar = [sec(buyuk), sec(kucuk), sec(rakam)];
  while (parcalar.length < 12) parcalar.push(sec(hepsi));
  for (let i = parcalar.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0]! % (i + 1);
    [parcalar[i], parcalar[j]] = [parcalar[j]!, parcalar[i]!];
  }
  return parcalar.join("");
}

function tarih(iso: string | null | undefined): string {
  if (!iso) return "Hiç girmedi";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function PanelUsersClient({
  users,
  roles,
  matris,
  meId,
}: {
  users: PanelUserDto[];
  roles: string[];
  matris: PanelRolMatrisiDto | null;
  meId: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("tasarimci");
  const [msg, setMsg] = useState<Msg>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || isPending) return;
    setMsg(null);
    startTransition(async () => {
      const r = await createPanelUser(email, password, role, fullName);
      setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
      if (r.ok) {
        setEmail("");
        setPassword("");
        setFullName("");
      }
    });
  };

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900">Panel Yetkilileri</h1>
        <p className="mt-1 text-sm text-ink-500">
          Yalnız süper admin yetkili ekler, düzenler, şifre sıfırlar, siler ve rol izinlerini ayarlar.
          Kendi hesabınız üzerinde rol/şifre/silme işlemi yapamazsınız.
        </p>
      </div>

      {/* Hesap oluşturma. E-posta zaten müşteri olarak kayıtlıysa API şifreye
          DOKUNMADAN rolünü yükseltir; zaten yetkiliyse 409 döner. */}
      <form onSubmit={submit} className="mb-6 bg-paper-50 border border-paper-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-ink-900">
          <UserPlus size={16} /> Yeni yetkili hesabı oluştur
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ad Soyad (opsiyonel)" className={INPUT} />
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kisi@ornek.com" className={INPUT} />
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre (en az 8; büyük, küçük ve rakam)"
              autoComplete="new-password"
              className={`${INPUT} font-mono flex-1 min-w-0`}
            />
            <button type="button" onClick={() => setPassword(rastgeleSifre())} className={`${BTN_KUCUK} border-paper-200 text-ink-700 hover:bg-paper-100`} title="Rastgele şifre üret">
              <ArrowsClockwise size={14} /> Üret
            </button>
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value)} className={INPUT}>
            {roles
              .filter((r) => r !== "customer")
              .map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r] ?? r}
                </option>
              ))}
          </select>
          <button type="submit" disabled={isPending} className="px-4 py-2 rounded-md bg-ink-900 text-paper-50 text-sm font-medium disabled:opacity-60">
            {isPending ? "Oluşturuluyor…" : "Hesabı oluştur"}
          </button>
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-500">
          <Info size={14} className="flex-none mt-0.5" />
          Şifreyi siz belirlersiniz; kişi ilk girişte kullanır. Şifre bir daha görüntülenemez, kaydedip kişiye
          güvenli bir kanaldan iletin. E-posta zaten kayıtlıysa yeni hesap açılmaz: kişi müşteriyse şifresine
          dokunulmadan yetkisi yükseltilir, zaten yetkiliyse aşağıdaki listeden değiştirmeniz istenir.
        </p>
        <p className="mt-1 text-xs text-ink-500">{ROLE_DESC[role]}</p>
      </form>

      {msg && (
        <p className={`mb-4 text-sm rounded-md px-3 py-2 border ${msg.ok ? "text-success bg-success/10 border-success/20" : "text-error bg-error/10 border-error/20"}`}>
          {msg.text}
        </p>
      )}

      <section className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
        <header className="px-4 py-3 border-b border-paper-200 flex items-center gap-2">
          <ShieldCheck size={16} className="text-brand-700" />
          <h2 className="text-sm font-semibold text-ink-900">Mevcut yetkililer ({users.length})</h2>
        </header>
        {users.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-500">
            Liste alınamadı ya da yetkiniz yok (bu sayfa yalnız süper admin içindir).
          </p>
        ) : (
          <ul className="divide-y divide-paper-200">
            {users.map((u) => (
              <YetkiliSatiri key={u.id} u={u} roles={roles} kendisi={u.id === meId} setMsg={setMsg} />
            ))}
          </ul>
        )}
      </section>

      <p className="mt-4 text-xs text-ink-500 leading-relaxed">
        Tüm işlemler denetim kaydına yazılır (kim, kimi, önce→sonra, IP); şifreler asla kaydedilmez. Son süper
        admin&apos;in yetkisi kaldırılamaz ve hesabı silinemez, panel sahipsiz kalmasın diye. Sipariş geçmişi
        olan bir hesap silinmez; yalnız panel yetkisi kaldırılır (fatura/sipariş kayıtları korunur).
      </p>

      <div className="mt-8">
        <RolYetkileri matris={matris} setMsg={setMsg} />
      </div>
    </AdminShell>
  );
}

function YetkiliSatiri({
  u,
  roles,
  kendisi,
  setMsg,
}: {
  u: PanelUserDto;
  roles: string[];
  kendisi: boolean;
  setMsg: (m: Msg) => void;
}) {
  const [mod, setMod] = useState<"kapali" | "duzenle" | "sifre">("kapali");
  const [ad, setAd] = useState(u.fullName ?? "");
  const [eposta, setEposta] = useState(u.email);
  const [yeniSifre, setYeniSifre] = useState("");
  const [isPending, startTransition] = useTransition();

  const onRoleChange = async (next: string) => {
    if (next === u.role) return;
    const ok = await confirm({
      title: "Kullanıcının yetkisi değişecek",
      description: u.email,
      bullets: [
        `${ROLE_LABEL[u.role] ?? u.role} → ${ROLE_LABEL[next] ?? next}`,
        next === "customer"
          ? "Panel erişimi kalkar ve açık oturumları hemen kapatılır."
          : "Yeni yetki, kullanıcının bir sonraki isteğinde geçerli olur.",
      ],
      confirmLabel: "Yetkiyi değiştir",
      tone: next === "customer" ? "danger" : "default",
    });
    if (!ok) return;
    setMsg(null);
    startTransition(async () => {
      const r = await changeRole(u.id, next);
      setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
    });
  };

  const kaydet = () => {
    const degisti = ad.trim() !== (u.fullName ?? "") || eposta.trim().toLowerCase() !== u.email.toLowerCase();
    if (!degisti) {
      setMod("kapali");
      return;
    }
    setMsg(null);
    startTransition(async () => {
      const r = await updatePanelUser(u.id, { fullName: ad, email: eposta });
      setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
      if (r.ok) setMod("kapali");
    });
  };

  const sifreSifirla = async () => {
    if (!yeniSifre) return;
    const ok = await confirm({
      title: "Şifre sıfırlanacak",
      description: u.email,
      bullets: [
        "Kişinin mevcut şifresi geçersiz olur.",
        "Açık tüm oturumları (bilgisayar/telefon) hemen kapatılır.",
        "Yeni şifre bir daha görüntülenemez; kişiye güvenli kanaldan iletin.",
      ],
      confirmLabel: "Şifreyi sıfırla",
      tone: "danger",
    });
    if (!ok) return;
    setMsg(null);
    startTransition(async () => {
      const r = await resetPanelUserPassword(u.id, yeniSifre);
      setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
      if (r.ok) {
        setYeniSifre("");
        setMod("kapali");
      }
    });
  };

  const sil = async () => {
    const ok = await confirm({
      title: "Yetkili hesabı silinecek",
      description: `${u.fullName || u.email} (${ROLE_LABEL[u.role] ?? u.role})`,
      bullets: [
        "Sipariş geçmişi yoksa hesap kalıcı olarak silinir; geri alınamaz.",
        "Sipariş geçmişi varsa hesap silinmez, yalnız panel yetkisi kaldırılır.",
        "Açık oturumları hemen kapatılır. Yazdığı iç notlar ve yüklediği dosyalar kalır.",
      ],
      confirmLabel: "Hesabı sil",
      tone: "danger",
    });
    if (!ok) return;
    setMsg(null);
    startTransition(async () => {
      const r = await deletePanelUser(u.id);
      setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
    });
  };

  const iptalEt = () => {
    setAd(u.fullName ?? "");
    setEposta(u.email);
    setYeniSifre("");
    setMod("kapali");
  };

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-900 truncate">
            {u.fullName || u.email}
            {kendisi && <span className="ml-2 text-[11px] font-normal text-ink-500">(siz)</span>}
            {u.twoFactorEnabled && (
              <span className="ml-2 inline-flex items-center gap-0.5 text-[11px] font-normal text-success">
                <ShieldCheck size={12} /> 2FA
              </span>
            )}
          </p>
          <p className="text-xs text-ink-500 truncate">
            {u.email} · Son giriş: {tarih(u.lastLoginAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={u.role}
            disabled={isPending || kendisi}
            title={kendisi ? "Kendi rolünüzü değiştiremezsiniz." : undefined}
            onChange={(e) => onRoleChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-paper-200 bg-paper-50 text-xs disabled:opacity-60"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r] ?? r}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setMod(mod === "duzenle" ? "kapali" : "duzenle")}
            disabled={isPending}
            className={`${BTN_KUCUK} border-paper-200 text-ink-700 hover:bg-paper-100`}
          >
            <PencilSimple size={14} /> Düzenle
          </button>
          <button
            type="button"
            onClick={() => setMod(mod === "sifre" ? "kapali" : "sifre")}
            disabled={isPending || kendisi}
            title={kendisi ? "Kendi şifrenizi profilinizden değiştirin." : undefined}
            className={`${BTN_KUCUK} border-paper-200 text-ink-700 hover:bg-paper-100`}
          >
            <Key size={14} /> Şifre
          </button>
          <button
            type="button"
            onClick={sil}
            disabled={isPending || kendisi}
            title={kendisi ? "Kendi hesabınızı silemezsiniz." : undefined}
            className={`${BTN_KUCUK} border-error/30 text-error hover:bg-error/10`}
          >
            <Trash size={14} /> Sil
          </button>
        </div>
      </div>

      {mod === "duzenle" && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-center rounded-md border border-paper-200 bg-paper-100/50 p-3">
          <input type="text" value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Ad Soyad" className={INPUT} />
          <input type="email" value={eposta} onChange={(e) => setEposta(e.target.value)} placeholder="E-posta" className={INPUT} />
          <div className="flex gap-2">
            <button type="button" onClick={kaydet} disabled={isPending} className={`${BTN_KUCUK} border-ink-900 bg-ink-900 text-paper-50`}>
              <Check size={14} /> Kaydet
            </button>
            <button type="button" onClick={iptalEt} disabled={isPending} className={`${BTN_KUCUK} border-paper-200 text-ink-700`}>
              <X size={14} /> Vazgeç
            </button>
          </div>
          <p className="sm:col-span-3 text-xs text-ink-500">
            E-posta değişirse kişi yeni e-postayla giriş yapar; şifresi aynı kalır.
          </p>
        </div>
      )}

      {mod === "sifre" && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto] items-center rounded-md border border-paper-200 bg-paper-100/50 p-3">
          <input
            type="text"
            value={yeniSifre}
            onChange={(e) => setYeniSifre(e.target.value)}
            placeholder="Yeni şifre (en az 8; büyük, küçük ve rakam)"
            autoComplete="new-password"
            className={`${INPUT} font-mono`}
          />
          <button type="button" onClick={() => setYeniSifre(rastgeleSifre())} className={`${BTN_KUCUK} border-paper-200 text-ink-700 hover:bg-paper-100`}>
            <ArrowsClockwise size={14} /> Üret
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={sifreSifirla} disabled={isPending || !yeniSifre} className={`${BTN_KUCUK} border-error bg-error text-paper-50`}>
              <Key size={14} /> Sıfırla
            </button>
            <button type="button" onClick={iptalEt} disabled={isPending} className={`${BTN_KUCUK} border-paper-200 text-ink-700`}>
              <X size={14} /> Vazgeç
            </button>
          </div>
          <p className="sm:col-span-3 text-xs text-ink-500">
            Kişinin açık oturumları kapanır; yeni şifreyi kaydedip güvenli kanaldan iletin.
          </p>
        </div>
      )}
    </li>
  );
}
