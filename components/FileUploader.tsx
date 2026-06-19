"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, Loader2, Layers, CheckSquare, Square, ArrowLeft } from "lucide-react";
import { parseWorkbook, listSheets } from "@/lib/parseExcel";
import { analizar } from "@/lib/analytics";
import { Analisis } from "@/lib/types";

type Etapa = "upload" | "sheets";

export default function FileUploader({ onLoaded }: { onLoaded: (a: Analisis, fileName: string) => void }) {
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<Etapa>("upload");
  const [hojas, setHojas] = useState<string[]>([]);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setEtapa("upload"); setHojas([]); setSeleccion(new Set());
    setBuffer(null); setFileName(""); setError(null);
  };

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!/\.(xlsx|xlsm|xls|csv)$/i.test(file.name)) {
      setError("Formato no soportado. Usa un archivo .xlsx, .xls o .csv.");
      return;
    }
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const nombres = listSheets(buf);
      setBuffer(buf);
      setFileName(file.name);
      setHojas(nombres);

      if (nombres.length <= 1) {
        // Una sola pestaña: procesar directo, sin paso intermedio.
        const { movimientos, hojas } = parseWorkbook(buf, nombres);
        onLoaded(analizar(movimientos, hojas), file.name);
      } else {
        // Varias pestañas: por defecto todas seleccionadas.
        setSeleccion(new Set(nombres));
        setEtapa("sheets");
      }
    } catch (e: any) {
      setError(e?.message || "No se pudo procesar el archivo.");
    } finally {
      setLoading(false);
    }
  }, [onLoaded]);

  const toggle = (nombre: string) => {
    setSeleccion((prev) => {
      const next = new Set(prev);
      next.has(nombre) ? next.delete(nombre) : next.add(nombre);
      return next;
    });
  };

  const analizarSeleccion = () => {
    if (!buffer || seleccion.size === 0) return;
    setError(null);
    setLoading(true);
    try {
      const nombres = hojas.filter((h) => seleccion.has(h));
      const { movimientos, hojas: hojasOk } = parseWorkbook(buffer, nombres);
      onLoaded(analizar(movimientos, hojasOk), fileName);
    } catch (e: any) {
      setError(e?.message || "No se pudo procesar la selección.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Paso 2: selección de pestañas ----------
  if (etapa === "sheets") {
    return (
      <div className="w-full">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-brand-50 p-2"><Layers className="h-6 w-6 text-brand-500" /></span>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Selecciona las pestañas a analizar</h3>
              <p className="text-sm text-slate-500">
                <span className="font-medium">{fileName}</span> · {hojas.length} pestañas detectadas. Puedes elegir una o varias.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => setSeleccion(new Set(hojas))} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Seleccionar todas</button>
            <button onClick={() => setSeleccion(new Set())} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Ninguna</button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {hojas.map((h) => {
              const on = seleccion.has(h);
              return (
                <button
                  key={h}
                  onClick={() => toggle(h)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                    on ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  {on ? <CheckSquare className="h-5 w-5 shrink-0 text-brand-500" /> : <Square className="h-5 w-5 shrink-0 text-slate-400" />}
                  <span className="truncate text-sm font-medium text-slate-700">{h}</span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button onClick={reset} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700">
              <ArrowLeft className="h-4 w-4" /> Cambiar archivo
            </button>
            <button
              onClick={analizarSeleccion}
              disabled={seleccion.size === 0 || loading}
              className="btn-primary"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              {loading ? "Procesando…" : `Analizar ${seleccion.size} pestaña${seleccion.size === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Paso 1: subir archivo ----------
  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          drag ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-white hover:bg-slate-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xlsm,.xls,.csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-brand-500">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="font-semibold">Procesando cartola…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-brand-50 p-4">
              <UploadCloud className="h-10 w-10 text-brand-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">Arrastra tu cartola bancaria (Excel)</p>
              <p className="text-sm text-slate-500">o haz clic para seleccionar · .xlsx, .xls, .csv</p>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Si el libro tiene varias pestañas, podrás elegir cuáles analizar.</span>
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
