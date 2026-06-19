import { saveAs } from "file-saver";
import { Analisis } from "./types";

// Genera un dataset plano (CSV UTF-8 con BOM) optimizado para Power BI / Excel.
// Una fila por movimiento, con columnas tipadas listas para modelar.
export function exportarDatasetPowerBI(a: Analisis, nombre = "Dataset_PowerBI.csv") {
  const headers = [
    "Fecha", "Mes", "MesNombre", "NumeroCartola", "NumeroOperacion",
    "Descripcion", "Clasificacion", "Tipo", "EsTraspaso",
    "Ingreso", "Egreso", "Neto", "Saldo",
  ];

  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [headers.join(";")];
  for (const m of a.movimientos) {
    lines.push([
      m.fechaISO, m.mes, m.mesNombre, m.nCartola ?? "", m.nOperacion ?? "",
      m.descripcion, m.clasificacion, m.tipo, m.esTraspaso ? "Sí" : "No",
      m.abono, m.cargo, m.abono - m.cargo, m.saldo ?? "",
    ].map(esc).join(";"));
  }

  const csv = "﻿" + lines.join("\r\n");
  saveAs(new Blob([csv], { type: "text/csv;charset=utf-8" }), nombre);
}

export function exportarInstruccionesPowerBI(nombre = "Como_usar_en_PowerBI.txt") {
  const txt = `GUÍA RÁPIDA — CARGAR EL INFORME EN POWER BI DESKTOP
====================================================

1) Descarga el archivo "Dataset_PowerBI.csv" desde la aplicación
   (botón "Exportar a Power BI").

2) Abre Power BI Desktop y selecciona:
   Inicio  ->  Obtener datos  ->  Texto/CSV
   Selecciona el archivo Dataset_PowerBI.csv
   - Origen de archivo: 65001: Unicode (UTF-8)
   - Delimitador: Punto y coma (;)
   Pulsa "Cargar".

3) Modelo de datos sugerido (medidas DAX):
   Ingresos      = SUM(Dataset[Ingreso])
   Egresos       = SUM(Dataset[Egreso])
   Flujo Neto    = [Ingresos] - [Egresos]
   N Movimientos = COUNTROWS(Dataset)

4) Visualizaciones recomendadas:
   - Tarjetas KPI: Ingresos, Egresos, Flujo Neto.
   - Gráfico de columnas: Flujo Neto por MesNombre.
   - Gráfico de barras: Egreso por Clasificacion (Top 10).
   - Gráfico circular: distribución de Egreso por Clasificacion.
   - Segmentador (slicer): por MesNombre y por Tipo.
   - Tabla: detalle de movimientos con filtros.

5) Tip: marca la columna "EsTraspaso = No" para analizar
   solo el resultado operacional (sin traspasos internos).

Las cifras están en pesos chilenos (CLP).
`;
  saveAs(new Blob([txt], { type: "text/plain;charset=utf-8" }), nombre);
}
