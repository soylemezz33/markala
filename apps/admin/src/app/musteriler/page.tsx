"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { MagnifyingGlass, EnvelopeSimple, Phone, Buildings, User as UserIcon, Star, Eye } from "@phosphor-icons/react";

const mockCustomers = [
  { id: "u_001", name: "Hasan Söylemez", email: "hasansylemezz@gmail.com", phone: "+905320000000", type: "individual", orders: 12, totalSpent: 24580, lastOrder: "04.05.2026", vip: true },
  { id: "u_002", name: "Ali Yıldız", email: "ali@firma.com", phone: "+905330000000", type: "individual", orders: 3, totalSpent: 1740, lastOrder: "06.05.2026", vip: false },
  { id: "u_003", name: "Mehmet Kara", company: "Kara Teknoloji A.Ş.", email: "mehmet@kurumsal.com", phone: "+905340000000", type: "corporate", orders: 8, totalSpent: 12840, lastOrder: "06.05.2026", vip: true },
  { id: "u_004", name: "Zeynep Aksoy", email: "zeynep@gmail.com", phone: "+905350000000", type: "individual", orders: 1, totalSpent: 2850, lastOrder: "06.05.2026", vip: false },
  { id: "u_005", name: "Ayşe Demir", company: "Demir Mağaza", email: "ayse@magaza.com", phone: "+905360000000", type: "corporate", orders: 5, totalSpent: 38420, lastOrder: "05.05.2026", vip: true },
];

export default function CustomersAdminPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = mockCustomers.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.company ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || c.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Müşteriler</h1>
        <p className="text-ink-500 text-sm mt-1">{filtered.length} müşteri</p>
      </header>

      <div className="mb-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg">
          <MagnifyingGlass size={16} className="text-ink-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            placeholder="İsim, e-posta, firma ara..."
            className="flex-1 bg-transparent outline-none text-sm text-ink-900"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm min-w-[180px]"
        >
          <option value="all">Tüm tipler</option>
          <option value="individual">Bireysel</option>
          <option value="corporate">Kurumsal</option>
        </select>
      </div>

      <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Müşteri</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">İletişim</th>
                <th className="text-center px-4 py-3 font-semibold">Tip</th>
                <th className="text-center px-4 py-3 font-semibold hidden md:table-cell">Sipariş</th>
                <th className="text-right px-4 py-3 font-semibold">Toplam Harcama</th>
                <th className="text-right px-4 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-200">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-paper-100/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-none w-9 h-9 rounded-full bg-brand-500/15 text-brand-700 grid place-items-center font-bold text-sm">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink-900 flex items-center gap-1.5">
                          {c.name}
                          {c.vip && <Star size={12} weight="fill" className="text-brand-500" />}
                        </div>
                        {c.company && <div className="text-[11px] text-ink-500">{c.company}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs hidden md:table-cell">
                    <div className="flex items-center gap-1 text-ink-700">
                      <EnvelopeSimple size={11} /> {c.email}
                    </div>
                    <div className="flex items-center gap-1 text-ink-500 mt-0.5">
                      <Phone size={11} /> {c.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-paper-100 text-ink-700">
                      {c.type === "corporate" ? <Buildings size={11} /> : <UserIcon size={11} />}
                      {c.type === "corporate" ? "Kurumsal" : "Bireysel"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-ink-700 hidden md:table-cell tabular-nums">{c.orders}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink-900 tabular-nums">
                    ₺ {c.totalSpent.toLocaleString("tr-TR")}
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
      </div>
    </AdminShell>
  );
}
