"use client";

import { Analisis } from "@/lib/types";
import { clp } from "@/lib/analytics";
import KpiCards from "./KpiCards";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

const PALETTE = ["#1f4e79", "#2e86c1", "#48c9b0", "#f4d03f", "#eb984e", "#cb4335", "#884ea0", "#5d6d7e", "#16a085", "#d35400"];

function compact(n: number) {
  return new Intl.NumberFormat("es-CL", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-4 h-72 w-full">{children}</div>
    </div>
  );
}

const tooltipFmt = (v: number) => clp(v);

export default function Dashboard({ a }: { a: Analisis }) {
  const mesData = a.porMes.map((m) => ({ name: m.mesNombre.slice(0, 3), Ingresos: m.ingresos, Egresos: m.egresos, Neto: m.neto }));
  const egresoData = a.topEgresos.slice(0, 8).map((c) => ({ name: c.categoria, value: c.egresos }));
  const ingresoData = a.topIngresos.slice(0, 8).map((c) => ({ name: c.categoria, value: c.ingresos }));

  return (
    <div className="space-y-6">
      <KpiCards a={a} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Flujo mensual" subtitle="Ingresos vs Egresos por mes">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mesData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} width={50} />
              <Tooltip formatter={tooltipFmt} />
              <Legend />
              <Bar dataKey="Ingresos" fill="#15803d" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Egresos" fill="#b91c1c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Evolución del flujo neto" subtitle="Resultado por mes">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mesData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} width={50} />
              <Tooltip formatter={tooltipFmt} />
              <Line type="monotone" dataKey="Neto" stroke="#1f4e79" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Egresos por clasificación" subtitle="Top 8 categorías de gasto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={egresoData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
              <XAxis type="number" tickFormatter={compact} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
              <Tooltip formatter={tooltipFmt} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {egresoData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribución de egresos" subtitle="Participación porcentual">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={egresoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2}>
                {egresoData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip formatter={tooltipFmt} />
              <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tabla categorias */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3">
          <h3 className="text-base font-semibold text-slate-800">Detalle por clasificación</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-500 text-white">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Clasificación</th>
                <th className="px-4 py-2.5 text-right font-semibold">Ingresos</th>
                <th className="px-4 py-2.5 text-right font-semibold">Egresos</th>
                <th className="px-4 py-2.5 text-right font-semibold">Neto</th>
                <th className="px-4 py-2.5 text-right font-semibold">N° Mov.</th>
              </tr>
            </thead>
            <tbody>
              {a.porCategoria.map((c, i) => (
                <tr key={c.categoria} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="px-4 py-2 font-medium text-slate-700">{c.categoria}</td>
                  <td className="px-4 py-2 text-right text-ingreso">{c.ingresos ? clp(c.ingresos) : "—"}</td>
                  <td className="px-4 py-2 text-right text-egreso">{c.egresos ? clp(c.egresos) : "—"}</td>
                  <td className={`px-4 py-2 text-right font-semibold ${c.neto >= 0 ? "text-ingreso" : "text-egreso"}`}>{clp(c.neto)}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{c.movimientos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
