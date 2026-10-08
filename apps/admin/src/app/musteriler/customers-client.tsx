"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { EnvelopeSimple, Phone, Buildings, User as UserIcon, Eye } from "@phosphor-icons/react";
import { Pagination, paginate } from "@/components/pagination";
import type { AdminUserDto } from "@markala/api-client";
import {
  useTableSort,
  SortTh,
  TableToolbar,
  FilterChips,
  TableEmpty,
  aramaEslesir,
  type SortAccessors,
} from "@/components/data-table";

interface Props {
  customers: AdminUserDto[];
}

const PAGE_SIZE = 20;

type CustSort = "name" | "email" | "type" | "orders" | "date";
const CUST_ACCESSORS: SortAccessors<AdminUserDto, CustSort> = {
  name: (c) => c.fullName,
  email: (c) => c.email,
  type: (c) => (c.accountType === "corporate" ? "Kurumsal" : "Bireysel"),
  orders: (c) => c.orderCount ?? 0,
  date: (c) => (c.createdAt ? new Date(c.createdAt) : null),
};

export function CustomersClient({ customers }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Telefonla arama: kayıtlar "+90 505 741 70 28" / "0505 741 70 28" gibi karışık biçimlerde
  // duruyor, yazılan terim ise düz rakam olabiliyor → iki tarafın rakamları karşılaştırılır.
  const searchDigits = search.replace(/\D/g, "");
  const filtered = useMemo(
    () =>
      customers.filter((c) => {
        const matchSearch =
          aramaEslesir(search, c.fullName, c.email, c.companyName) ||
          (searchDigits.length >= 7 && (c.phone ?? "").replace(/\D/g, "").includes(searchDigits));
        const matchType = typeFilter === "all" || c.accountType === typeFilter;
        return matchSearch && matchType;
      }),
    [customers, search, searchDigits, typeFilter],
  );
  const { rows: siraliMusteriler, thProps } = useTableSort(filtered, CUST_ACCESSORS, { key: "date" });
  const filtreAktif = search !== "" || typeFilter !== "all";
  const temizle = () => {
    setSearch("");
    setTypeFilter("all");
  };

  // Filtre/arama değişince ilk sayfaya dön.
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  // ?q=… ile gelen arama terimi (Chatwoot panel uygulamasındaki "Panelde ara" bağlantısı
  // telefonu böyle taşır). Mount sonrası okunur — SSR/istemci farkı hydration uyarısı vermesin.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearch(q);
  }, []);

  const { pageItems, pageCount, safePage } = paginate(siraliMusteriler, page, PAGE_SIZE);

  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Müşteriler</h1>
        <p className="text-ink-500 text-sm mt-1">{filtered.length} kullanıcı</p>
      </header>

      <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
        <TableToolbar
          search={{
            id: "musteri-ara",
            value: search,
            onChange: setSearch,
            placeholder: "İsim, e-posta, firma veya telefon ara…",
            className: "w-72",
          }}
          count={{ gosterilen: filtered.length, toplam: customers.length, birim: "kullanıcı" }}
          onClear={filtreAktif ? temizle : null}
        >
          <FilterChips
            label="Hesap tipi"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "all", label: "Tümü" },
              {
                value: "individual",
                label: "Bireysel",
                count: customers.filter((c) => c.accountType === "individual").length,
              },
              {
                value: "corporate",
                label: "Kurumsal",
                count: customers.filter((c) => c.accountType === "corporate").length,
              },
            ]}
          />
        </TableToolbar>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
              <tr>
                <SortTh sortKey="name" {...thProps} className="text-left px-4 py-3 font-semibold">Müşteri</SortTh>
                <SortTh sortKey="email" {...thProps} className="text-left px-4 py-3 font-semibold hidden md:table-cell">İletişim</SortTh>
                <SortTh sortKey="type" {...thProps} align="center" className="text-center px-4 py-3 font-semibold">Tip</SortTh>
                <SortTh sortKey="orders" {...thProps} align="center" className="text-center px-4 py-3 font-semibold hidden md:table-cell">Sipariş</SortTh>
                <SortTh sortKey="date" {...thProps} align="center" className="text-center px-4 py-3 font-semibold hidden md:table-cell">Üyelik Tarihi</SortTh>
                <th className="text-right px-4 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-200">
              {pageItems.length === 0 && (
                <TableEmpty colSpan={6} filtreli={filtreAktif} onClear={temizle} bosMesaj="Kayıtlı müşteri yok." />
              )}
              {pageItems.map((c) => (
                <tr key={c.id} className="hover:bg-paper-100/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-none w-9 h-9 rounded-full bg-brand-500/15 text-brand-700 grid place-items-center font-bold text-sm">
                        {c.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink-900">{c.fullName}</div>
                        {c.companyName && (
                          <div className="text-[11px] text-ink-500">{c.companyName}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs hidden md:table-cell">
                    <div className="flex items-center gap-1 text-ink-700">
                      <EnvelopeSimple size={11} /> {c.email}
                    </div>
                    {c.phone && (
                      <div className="flex items-center gap-1 text-ink-500 mt-0.5">
                        <Phone size={11} /> {c.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-paper-100 text-ink-700">
                      {c.accountType === "corporate" ? (
                        <Buildings size={11} />
                      ) : (
                        <UserIcon size={11} />
                      )}
                      {c.accountType === "corporate" ? "Kurumsal" : "Bireysel"}
                    </span>
                    {c.accountType === "corporate" && c.corporateStatus && (
                      <span
                        className={`mt-1 block text-[10px] font-semibold ${
                          c.corporateStatus === "approved"
                            ? "text-success"
                            : c.corporateStatus === "rejected"
                              ? "text-error"
                              : "text-warning"
                        }`}
                      >
                        {c.corporateStatus === "approved"
                          ? "● Onaylı"
                          : c.corporateStatus === "rejected"
                            ? "● Reddedildi"
                            : "● Onay Bekliyor"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-ink-700 hidden md:table-cell tabular-nums">
                    {c.orderCount ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-ink-700 hidden md:table-cell tabular-nums text-xs">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString("tr-TR") : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/musteriler/${c.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100"
                    >
                      <Eye size={12} /> Görüntüle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={safePage}
          pageCount={pageCount}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </AdminShell>
  );
}
