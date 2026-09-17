"use client";

import { useMemo, useState, useTransition } from "react";
import type { PanelRolMatrisiDto } from "@markala/api-client";
import { confirm } from "@/components/confirm-dialog";
import { LockSimple, ArrowCounterClockwise, FloppyDisk, Info } from "@phosphor-icons/react";
import { saveRolePerms, resetRolePerms } from "./actions";

type Msg = { ok: boolean; text: string } | null;

function ayniKume(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

/**
 * ROL İZİN MATRİSİ (2026-09-17, Hasan: "tasarımcı/kargo/admin/süper adminin hangi yetkileri
 * olduğunu ayarlayabilelim").
 *
 * Satır = izin anahtarı (API'deki PERM), sütun = rol. Süper admin kilitli (her şey işaretli,
 * değiştirilemez). Sütun altındaki "Kaydet" yalnız o rolde değişiklik varsa açılır; kayıt
 * varsayılanla birebir aynıysa API özel kaydı siler → rozet kalkar.
 */
export function RolYetkileri({ matris, setMsg }: { matris: PanelRolMatrisiDto | null; setMsg: (m: Msg) => void }) {
  const [secim, setSecim] = useState<Record<string, string[]>>(() =>
    Object.fromEntries((matris?.roller ?? []).map((r) => [r.rol, [...r.izinler]])),
  );
  const [isPending, startTransition] = useTransition();

  const gruplar = useMemo(() => {
    const sira: string[] = [];
    const harita = new Map<string, PanelRolMatrisiDto["izinler"]>();
    for (const izin of matris?.izinler ?? []) {
      if (!harita.has(izin.grup)) {
        harita.set(izin.grup, []);
        sira.push(izin.grup);
      }
      harita.get(izin.grup)!.push(izin);
    }
    return sira.map((g) => ({ grup: g, izinler: harita.get(g)! }));
  }, [matris]);

  if (!matris) {
    return (
      <section className="bg-paper-50 border border-paper-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-ink-900">Rol yetkileri</h2>
        <p className="mt-2 text-sm text-ink-500">İzin matrisi alınamadı ya da yetkiniz yok (yalnız süper admin).</p>
      </section>
    );
  }

  const toggle = (rol: string, key: string) => {
    setSecim((prev) => {
      const mevcut = prev[rol] ?? [];
      const yeni = mevcut.includes(key) ? mevcut.filter((k) => k !== key) : [...mevcut, key];
      return { ...prev, [rol]: yeni };
    });
  };

  const kaydet = async (rol: string, label: string) => {
    const izinler = secim[rol] ?? [];
    const onceki = matris.roller.find((r) => r.rol === rol)?.izinler ?? [];
    const eklenen = izinler.filter((k) => !onceki.includes(k));
    const kaldirilan = onceki.filter((k) => !izinler.includes(k));
    const etiket = (k: string) => matris.izinler.find((i) => i.key === k)?.label ?? k;
    const ok = await confirm({
      title: `${label} rolünün izinleri değişecek`,
      bullets: [
        ...(eklenen.length ? [`Eklenen: ${eklenen.map(etiket).join(", ")}`] : []),
        ...(kaldirilan.length ? [`Kaldırılan: ${kaldirilan.map(etiket).join(", ")}`] : []),
        "API tarafında anında geçerli olur; panel sayfa erişimi en geç 15 dakikada (oturum yenilemesinde) güncellenir.",
        "Bu roldeki TÜM kullanıcıları etkiler.",
      ],
      confirmLabel: "Kaydet",
      tone: kaldirilan.length === 0 && eklenen.length > 0 ? "danger" : "default",
    });
    if (!ok) return;
    setMsg(null);
    startTransition(async () => {
      const r = await saveRolePerms(rol, izinler);
      setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
    });
  };

  const sifirla = async (rol: string, label: string) => {
    const ok = await confirm({
      title: `${label} rolü varsayılana dönecek`,
      description: "Panelden yapılan özel izin ayarı silinir; kod-içi varsayılan izin seti geçerli olur.",
      confirmLabel: "Varsayılana dön",
    });
    if (!ok) return;
    setMsg(null);
    startTransition(async () => {
      const r = await resetRolePerms(rol);
      setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
      if (r.ok) {
        const varsayilan = matris.roller.find((x) => x.rol === rol)?.varsayilan ?? [];
        setSecim((prev) => ({ ...prev, [rol]: [...varsayilan] }));
      }
    });
  };

  return (
    <section className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
      <header className="px-4 py-3 border-b border-paper-200">
        <h2 className="text-sm font-semibold text-ink-900">Rol yetkileri</h2>
        <p className="mt-1 text-xs text-ink-500">
          Her rolün panelde neyi görüp neyi yapabileceğini buradan ayarlayın. Süper admin kilitlidir.
          Değişiklik o roldeki herkesi etkiler ve denetim kaydına yazılır.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-paper-200 bg-paper-100/60">
              <th className="text-left px-4 py-2 font-medium text-ink-700 w-[40%]">İzin</th>
              {matris.roller.map((r) => {
                const dirty = !ayniKume(secim[r.rol] ?? [], r.izinler);
                return (
                  <th key={r.rol} className="px-2 py-2 text-center font-medium text-ink-900 align-top">
                    <div className="inline-flex items-center gap-1">
                      {r.kilitli && <LockSimple size={12} className="text-ink-500" />}
                      {r.label}
                    </div>
                    <div className="mt-0.5 text-[10px] font-normal text-ink-500">
                      {r.kilitli ? "kilitli" : dirty ? "kaydedilmedi" : r.ozellestirilmis ? "özelleştirildi" : "varsayılan"}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {gruplar.map(({ grup, izinler }) => (
              <GrupSatirlari key={grup} grup={grup} izinler={izinler} roller={matris.roller} secim={secim} toggle={toggle} disabled={isPending} />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-paper-200 bg-paper-100/60">
              <td className="px-4 py-2 text-xs text-ink-500">Sütun başına kaydedin.</td>
              {matris.roller.map((r) => {
                const dirty = !ayniKume(secim[r.rol] ?? [], r.izinler);
                const varsayilanDisi = !ayniKume(secim[r.rol] ?? [], r.varsayilan);
                return (
                  <td key={r.rol} className="px-2 py-2 text-center align-top">
                    {r.kilitli ? (
                      <span className="text-[11px] text-ink-500">—</span>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={() => kaydet(r.rol, r.label)}
                          disabled={isPending || !dirty}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-ink-900 text-paper-50 text-xs font-medium disabled:opacity-40"
                        >
                          <FloppyDisk size={12} /> Kaydet
                        </button>
                        <button
                          type="button"
                          onClick={() => sifirla(r.rol, r.label)}
                          disabled={isPending || (!r.ozellestirilmis && !varsayilanDisi)}
                          className="inline-flex items-center gap-1 text-[11px] text-ink-500 hover:text-ink-900 disabled:opacity-40"
                        >
                          <ArrowCounterClockwise size={12} /> Varsayılana dön
                        </button>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="px-4 py-3 flex items-start gap-1.5 text-xs text-ink-500 border-t border-paper-200">
        <Info size={14} className="flex-none mt-0.5" />
        <span>
          Admin rolü daraltıldığında kısıt, izin anahtarıyla işaretlenmiş sayfa ve API uçlarında uygulanır; yetkili
          yönetimi (bu sayfa) her durumda yalnız süper admine açıktır. &quot;Tutarları görme&quot; kapatıldığında
          sipariş ve müşteri yanıtlarındaki parasal alanlar sunucuda silinir.
        </span>
      </p>
    </section>
  );
}

function GrupSatirlari({
  grup,
  izinler,
  roller,
  secim,
  toggle,
  disabled,
}: {
  grup: string;
  izinler: PanelRolMatrisiDto["izinler"];
  roller: PanelRolMatrisiDto["roller"];
  secim: Record<string, string[]>;
  toggle: (rol: string, key: string) => void;
  disabled: boolean;
}) {
  return (
    <>
      <tr className="bg-paper-100/40">
        <td colSpan={roller.length + 1} className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
          {grup}
        </td>
      </tr>
      {izinler.map((izin) => (
        <tr key={izin.key} className="border-b border-paper-200/70">
          <td className="px-4 py-2 align-top">
            <div className="font-medium text-ink-900">{izin.label}</div>
            <div className="text-xs text-ink-500">{izin.aciklama}</div>
          </td>
          {roller.map((r) => {
            const secili = r.kilitli ? true : (secim[r.rol] ?? []).includes(izin.key);
            const varsayilanda = r.varsayilan.includes(izin.key);
            return (
              <td key={r.rol} className="px-2 py-2 text-center align-middle">
                <label className="inline-flex items-center justify-center cursor-pointer" title={r.kilitli ? "Süper admin kısıtlanamaz" : varsayilanda ? "Varsayılanda açık" : "Varsayılanda kapalı"}>
                  <input
                    type="checkbox"
                    checked={secili}
                    disabled={r.kilitli || disabled}
                    onChange={() => toggle(r.rol, izin.key)}
                    className="h-4 w-4 accent-brand-700 disabled:opacity-50"
                  />
                  {!r.kilitli && secili !== varsayilanda && (
                    <span className="ml-1 h-1.5 w-1.5 rounded-full bg-warning" aria-label="varsayılandan farklı" />
                  )}
                </label>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
