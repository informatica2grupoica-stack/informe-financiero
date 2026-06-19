"use client";

import { Analisis } from "@/lib/types";
import { clp, num } from "@/lib/analytics";
import { TrendingUp, TrendingDown, Wallet, ListChecks } from "lucide-react";

export default function KpiCards({ a }: { a: Analisis }) {
  const t = a.totales;
  const items = [
    { label: "Ingresos totales", value: clp(t.ingresos), icon: TrendingUp, color: "text-ingreso", bg: "bg-green-50" },
    { label: "Egresos totales", value: clp(t.egresos), icon: TrendingDown, color: "text-egreso", bg: "bg-red-50" },
    { label: "Flujo neto", value: clp(t.neto), icon: Wallet, color: t.neto >= 0 ? "text-ingreso" : "text-egreso", bg: "bg-brand-50" },
    { label: "Movimientos", value: num(t.nMovimientos), icon: ListChecks, color: "text-brand-500", bg: "bg-slate-100" },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">{it.label}</p>
            <span className={`rounded-lg p-2 ${it.bg}`}>
              <it.icon className={`h-5 w-5 ${it.color}`} />
            </span>
          </div>
          <p className={`mt-3 text-2xl font-bold ${it.color}`}>{it.value}</p>
        </div>
      ))}
    </div>
  );
}
