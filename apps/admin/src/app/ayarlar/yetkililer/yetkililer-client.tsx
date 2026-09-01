"use client";

import { useState, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { ShieldCheck, UserPlus, Info } from "@phosphor-icons/react";
import { createPanelUser, changeRole } from "./actions";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Süper Admin",
  admin: "Admin",
  tasarimci: "Grafik Tasarım",
  kargo: "Kargo",
  muhasebe: "Muhasebe",
  customer: "Yetkisiz (müşteri)",
};

const ROLE_DESC: Record<string, string> = {
  super_admin: "Her şeye erişir; yetki atayabilir.",
  admin: "Her şeye erişir; yetki atayamaz.",
  tasarimci: "Sipariş içeriği (fiyat/ödeme durumu dahil), müşteri iletişimi, görsel/slider/banner, yorumlar. Ciroyu (dashboard finans kutuları) GÖRMEZ.",
  kargo: "Sadece kargo işi: siparişin ne olduğunu, alıcının adı/adresi/telefonu/e-postasını ve yüklenen tasarım dosyasını görür; takip numarası girer ve siparişi \"Kargoya Verildi\" yapar. TUTAR, MALİYET, ÖDEME ve FATURA GÖRMEZ; sipariş iptal EDEMEZ.",
  muhasebe: "Para akışı, fatura/Paraşüt, cari, fiyat güncelleme. Görsel/içerik menüleri kapalı.",
  customer: "Panel erişimi kaldırılır.",
};

type U = { id: string; email: string; fullName: string | null; role: string; createdAt: string };

export function PanelUsersClient({ users, roles }: { users: U[]; roles: string[] }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("tasarimci");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
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

  const onRoleChange = (u: U, next: string) => {
    if (next === u.role) return;
    const ok = window.confirm(
      `${u.email} kullanıcısının yetkisi "${ROLE_LABEL[next] ?? next}" olarak değişecek.\n\nDevam edilsin mi?`,
    );
    if (!ok) return;
    setMsg(null);
    startTransition(async () => {
      const r = await changeRole(u.id, next);
      setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
    });
  };

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900">Panel Yetkilileri</h1>
        <p className="mt-1 text-sm text-ink-500">
          Yalnız süper admin yetki atayabilir. Kendi rolünüzü değiştiremezsiniz.
        </p>
      </div>

      {/* Hesap oluşturma. E-posta zaten müşteri olarak kayıtlıysa API şifreye
          DOKUNMADAN rolünü yükseltir; zaten yetkiliyse 409 döner. */}
      <form onSubmit={submit} className="mb-6 bg-paper-50 border border-paper-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-ink-900">
          <UserPlus size={16} /> Yeni yetkili hesabı oluştur
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ad Soyad (opsiyonel)"
            className="px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kisi@ornek.com"
            className="px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm"
          />
          <input
            type="text"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre (en az 8; büyük, küçük ve rakam)"
            autoComplete="new-password"
            className="px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm font-mono"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm"
          >
            {roles
              .filter((r) => r !== "customer")
              .map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r] ?? r}
                </option>
              ))}
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-md bg-ink-900 text-paper-50 text-sm font-medium disabled:opacity-60"
          >
            {isPending ? "Oluşturuluyor…" : "Hesabı oluştur"}
          </button>
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-500">
          <Info size={14} className="flex-none mt-0.5" />
          Şifreyi siz belirlersiniz; kişi ilk girişte kullanır. Şifre bir daha
          görüntülenemez, kaydedip kişiye güvenli bir kanaldan iletin. E-posta zaten
          kayıtlıysa yeni hesap açılmaz: kişi müşteriyse şifresine dokunulmadan yetkisi
          yükseltilir, zaten yetkiliyse aşağıdaki listeden değiştirmeniz istenir.
        </p>
        <p className="mt-1 text-xs text-ink-500">{ROLE_DESC[role]}</p>
      </form>

      {msg && (
        <p
          className={`mb-4 text-sm rounded-md px-3 py-2 border ${
            msg.ok ? "text-success bg-success/10 border-success/20" : "text-error bg-error/10 border-error/20"
          }`}
        >
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
              <li key={u.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{u.fullName || u.email}</p>
                  <p className="text-xs text-ink-500 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-500 hidden sm:inline">{ROLE_LABEL[u.role] ?? u.role}</span>
                  <select
                    value={u.role}
                    disabled={isPending}
                    onChange={(e) => onRoleChange(u, e.target.value)}
                    className="px-2.5 py-1.5 rounded-md border border-paper-200 bg-paper-50 text-xs disabled:opacity-60"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r] ?? r}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-4 text-xs text-ink-500 leading-relaxed">
        Yetki değişiklikleri denetim kaydına yazılır (kim, kimi, önce→sonra, IP). Son süper
        admin&apos;in yetkisi kaldırılamaz, panel sahipsiz kalmasın diye.
      </p>
    </AdminShell>
  );
}
