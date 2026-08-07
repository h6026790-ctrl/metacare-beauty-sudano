// Presentational building blocks shared across Administrator centers.
import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";

export function CenterHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-2xl text-foreground md:text-3xl">{title}</h1>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function Kpi({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone?: "warning" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-glass">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${tone === "warning" ? "bg-warning/15 text-warning-foreground" : "gradient-brand text-primary-foreground"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-2xl text-foreground">{value}</p>
    </div>
  );
}

export function Th({ children, align }: { children: React.ReactNode; align?: "start" | "end" }) {
  return <th className={align === "end" ? "p-3 text-end font-medium" : "p-3 text-start font-medium"}>{children}</th>;
}

export function Td({ children, align }: { children: React.ReactNode; align?: "start" | "end" }) {
  return <td className={align === "end" ? "p-3 text-end" : "p-3 text-start"}>{children}</td>;
}

export function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-start text-sm">{children}</table>
    </div>
  );
}

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-8 text-center text-sm text-muted-foreground">{label}</td>
    </tr>
  );
}

export function StockEditor({ stock, onSave }: { stock: number; onSave: (n: number) => Promise<void> }) {
  const [v, setV] = useState(stock);
  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="number" min={0} value={v}
        onChange={(e) => setV(Number(e.target.value))}
        className="h-7 w-16 rounded border border-input bg-background px-2 text-xs"
      />
      <button
        onClick={() => onSave(v)}
        disabled={stock === v}
        className="rounded-full bg-primary px-2 py-1 text-[10px] text-primary-foreground disabled:opacity-40"
      >
        {stock === v ? "—" : "Save"}
      </button>
    </span>
  );
}

/** In-workspace sub navigation for centers that own several screens. */
export function SubNav({ items }: { items: { to: string; label: string; exact?: boolean }[] }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav className="mb-5 flex flex-wrap gap-2 border-b border-border pb-3">
      {items.map((it) => {
        const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              active ? "gradient-brand text-primary-foreground shadow-glow" : "border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
