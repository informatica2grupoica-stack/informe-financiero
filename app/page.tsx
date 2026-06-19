"use client";

import { useState } from "react";
import { Analisis } from "@/lib/types";
import FileUploader from "@/components/FileUploader";
import Dashboard from "@/components/Dashboard";
import ReportActions from "@/components/ReportActions";
import { BarChart3, FileDown, RotateCcw, Building2 } from "lucide-react";

export default function Home() {
  const [analisis, setAnalisis] = useState<Analisis | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [tab, setTab] = useState<"dashboard" | "informes">("dashboard");

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-brand-700 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-white/10 p-2"><Building2 className="h-6 w-6" /></span>
            <div>
              <h1 className="text-lg font-bold leading-tight">Informe Ejecutivo Financiero</h1>
              <p className="text-xs text-brand-100">Cartola bancaria → Dashboards · Excel · Word · Power BI</p>
            </div>
          </div>
          {analisis && (
            <button
              onClick={() => { setAnalisis(null); setFileName(""); }}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
            >
              <RotateCcw className="h-4 w-4" /> Cargar otra cartola
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {!analisis ? (
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-slate-800">Genera tu informe en segundos</h2>
              <p className="mt-2 text-slate-500">
                Sube tu cartola bancaria clasificada y obtén dashboards interactivos e informes
                profesionales en Excel y Word. Todo en tu navegador, sin guardar datos.
              </p>
            </div>
            <FileUploader onLoaded={(a, name) => { setAnalisis(a); setFileName(name); }} />
          </div>
        ) : (
          <>
            {/* Sub-header periodo */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Archivo: <span className="font-medium text-slate-700">{fileName}</span></p>
                <p className="text-xl font-bold text-slate-800">Período: {analisis.periodo.etiqueta}</p>
              </div>
              {/* Tabs */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  onClick={() => setTab("dashboard")}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${
                    tab === "dashboard" ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <BarChart3 className="h-4 w-4" /> Tablero (Power BI)
                </button>
                <button
                  onClick={() => setTab("informes")}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${
                    tab === "informes" ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FileDown className="h-4 w-4" /> Informes y Descargas
                </button>
              </div>
            </div>

            {tab === "dashboard" ? <Dashboard a={analisis} /> : (
              <div className="space-y-6">
                <div className="card border-l-4 border-l-brand-500 p-5">
                  <h2 className="text-lg font-semibold text-slate-800">Descarga tus informes</h2>
                  <p className="text-sm text-slate-500">
                    Genera documentos listos para presentar. Cada formato se crea al instante a partir de los datos cargados.
                  </p>
                </div>
                <ReportActions a={analisis} />
              </div>
            )}
          </>
        )}
      </div>

      <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Procesamiento 100% local en el navegador · Sin base de datos · Desplegable en Vercel
      </footer>
    </main>
  );
}
