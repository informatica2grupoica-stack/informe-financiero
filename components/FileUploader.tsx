"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, Loader2 } from "lucide-react";
import { parseWorkbook } from "@/lib/parseExcel";
import { analizar } from "@/lib/analytics";
import { Analisis } from "@/lib/types";

export default function FileUploader({ onLoaded }: { onLoaded: (a: Analisis, fileName: string) => void }) {
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!/\.(xlsx|xlsm|xls|csv)$/i.test(file.name)) {
      setError("Formato no soportado. Usa un archivo .xlsx, .xls o .csv.");
      return;
    }
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const { movimientos } = parseWorkbook(buf);
      const analisis = analizar(movimientos);
      onLoaded(analisis, file.name);
    } catch (e: any) {
      setError(e?.message || "No se pudo procesar el archivo.");
    } finally {
      setLoading(false);
    }
  }, [onLoaded]);

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
              <span>El archivo se procesa en tu navegador. No se sube a ningún servidor.</span>
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
