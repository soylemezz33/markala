import Link from "next/link";
import { AdminShell } from "./admin-shell";
import { CheckCircle, Plus, Wrench } from "@phosphor-icons/react/dist/ssr";

interface PlaceholderProps {
  title: string;
  desc: string;
  icon: typeof CheckCircle;
  endpoints: Array<{ method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT"; path: string; desc: string }>;
  features: string[];
  newButton?: { label: string; href?: string };
  table?: { columns: string[]; rows: Array<Record<string, string>> };
}

export function AdminPlaceholder({
  title, desc, icon: Icon, endpoints, features, newButton, table,
}: PlaceholderProps) {
  return (
    <AdminShell>
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900 flex items-center gap-2">
            <Icon size={26} weight="bold" className="text-brand-700" />
            {title}
          </h1>
          <p className="text-ink-500 text-sm mt-1">{desc}</p>
        </div>
        {newButton && (
          <Link
            href={newButton.href ?? "#"}
            className="inline-flex items-center gap-2 bg-ink-900 text-paper-50 px-4 py-2 rounded-md text-sm font-medium hover:bg-ink-700"
          >
            <Plus size={14} weight="bold" /> {newButton.label}
          </Link>
        )}
      </header>

      {table && (
        <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  {table.columns.map((c) => (
                    <th key={c} className="text-left px-4 py-3 font-semibold">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200">
                {table.rows.map((r, i) => (
                  <tr key={i} className="hover:bg-paper-100/40">
                    {table.columns.map((c) => (
                      <td key={c} className="px-4 py-3 text-ink-700">{r[c] ?? "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-paper-50 border border-paper-200 rounded-lg p-5">
          <h2 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
            <CheckCircle size={16} weight="fill" className="text-success" />
            Bu Modülde Neler Olacak
          </h2>
          <ul className="space-y-2 text-sm text-ink-700">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle size={14} weight="fill" className="text-success mt-0.5 flex-none" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-ink-900 text-paper-100 rounded-lg p-5">
          <h2 className="font-semibold text-paper-50 mb-3 flex items-center gap-2">
            <Wrench size={16} className="text-brand-400" />
            API Endpoint'leri
          </h2>
          <div className="space-y-2 text-xs">
            {endpoints.map((e, i) => (
              <div key={i} className="flex items-start gap-2 font-mono">
                <span className={`flex-none px-2 py-0.5 rounded text-[10px] font-bold ${
                  e.method === "GET" ? "bg-success/20 text-success" :
                  e.method === "POST" ? "bg-brand-500/20 text-brand-400" :
                  e.method === "DELETE" ? "bg-error/20 text-error" :
                  "bg-warning/20 text-warning"
                }`}>{e.method}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-paper-50">{e.path}</div>
                  <div className="text-paper-100/60 font-sans text-[11px]">{e.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="mt-6 text-xs text-ink-500 text-center">
        🚧 Bu modül FAZ 4'te canlıya geçecek. Backend Postgres'e bağlandığında <code className="font-mono px-1.5 py-0.5 bg-paper-100 rounded">@markala/api-client</code> üzerinden gerçek veri akacak.
      </p>
    </AdminShell>
  );
}
