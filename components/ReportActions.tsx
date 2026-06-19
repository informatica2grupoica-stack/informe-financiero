"use client";

import { useState } from "react";
import { Analisis } from "@/lib/types";
import { exportarExcel } from "@/lib/exportExcel";
import { exportarWord } from "@/lib/exportWord";
import { exportarDatasetPowerBI, exportarInstruccionesPowerBI } from "@/lib/exportPowerBI";
import { generarGraficos } from "@/lib/chartImages";
import { FileSpreadsheet, FileText, BarChart3, Download, Loader2, CheckCircle2 } from "lucide-react";

type Card = {
  key: string;
  title: string;
  desc: string;
  icon: any;
  accent: string;
  action: () => Promise<void> | void;
  btn: string;
};

export default function ReportActions({ a }: { a: Analisis }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<void> | void) => {
    setBusy(key); setDone(null);
    try { await fn(); setDone(key); setTimeout(() => setDone(null), 2500); }
    finally { setBusy(null); }
  };

  const cards: Card[] = [
    {
      key: "excel", title: "Informe en Excel", btn: "Descargar Excel",
      desc: "Libro profesional con hoja Dashboard (gráficos del tablero incrustados) + Resumen ejecutivo, Flujo mensual, Por categoría y Detalle de movimientos. Con formato, colores y filtros.",
      icon: FileSpreadsheet, accent: "from-green-500 to-emerald-600",
      action: () => exportarExcel(a, generarGraficos(a)),
    },
    {
      key: "word", title: "Informe en Word", btn: "Descargar Word",
      desc: "Documento ejecutivo detallado: resumen, metodología, análisis de ingresos y egresos, evolución mensual, resultado operacional y recomendaciones — con gráficos incrustados.",
      icon: FileText, accent: "from-blue-500 to-brand-600",
      action: () => exportarWord(a, generarGraficos(a)),
    },
    {
      key: "pbi", title: "Dataset para Power BI", btn: "Exportar a Power BI",
      desc: "CSV plano y tipado (una fila por movimiento) listo para cargar en Power BI Desktop, junto a una guía paso a paso con medidas DAX sugeridas.",
      icon: BarChart3, accent: "from-amber-500 to-orange-600",
      action: () => { exportarDatasetPowerBI(a); setTimeout(() => exportarInstruccionesPowerBI(), 400); },
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {cards.map((c) => (
        <div key={c.key} className="card flex flex-col overflow-hidden">
          <div className={`bg-gradient-to-r ${c.accent} p-5`}>
            <c.icon className="h-9 w-9 text-white" />
            <h3 className="mt-3 text-lg font-bold text-white">{c.title}</h3>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <p className="flex-1 text-sm leading-relaxed text-slate-600">{c.desc}</p>
            <button
              onClick={() => run(c.key, c.action)}
              disabled={busy !== null}
              className="btn-primary mt-5 w-full"
            >
              {busy === c.key ? <Loader2 className="h-4 w-4 animate-spin" /> :
                done === c.key ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              {busy === c.key ? "Generando…" : done === c.key ? "¡Listo!" : c.btn}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
