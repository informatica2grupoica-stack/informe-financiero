import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import { Analisis } from "./types";
import { clp, num, pct } from "./analytics";
import { GraficosInforme } from "./exportExcel";

const BRAND = "1F4E79";
const WHITE = "FFFFFF";
const LIGHT = "D9E6FF";

function cell(text: string, opts: { bold?: boolean; color?: string; bg?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  return new TableCell({
    shading: opts.bg ? { type: ShadingType.CLEAR, fill: opts.bg, color: "auto" } : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        children: [new TextRun({ text, bold: opts.bold, color: opts.color, size: 18 })],
      }),
    ],
  });
}

function headerRow(labels: string[]) {
  return new TableRow({
    tableHeader: true,
    children: labels.map((l, i) =>
      cell(l, { bold: true, color: WHITE, bg: BRAND, align: i === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT })
    ),
  });
}

const noBorders = {
  top: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD" },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD" },
  left: { style: BorderStyle.NONE, size: 0, color: "auto" },
  right: { style: BorderStyle.NONE, size: 0, color: "auto" },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "EEEEEE" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
};

// ---- helpers de redacción ----
function h1(n: string) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: n, color: BRAND, bold: true })] });
}
function h2(n: string) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 80 }, children: [new TextRun({ text: n, color: BRAND, bold: true })] });
}
function p(text: string) {
  return new Paragraph({ spacing: { after: 140 }, alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text, size: 20 })] });
}
function bullet(text: string) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text, size: 20 })] });
}
function spacer() {
  return new Paragraph({ text: "", spacing: { after: 160 } });
}
function caption(text: string) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text, italics: true, size: 16, color: "888888" })] });
}

function imagen(g: { bytes: Uint8Array; width: number; height: number } | undefined, maxW = 540) {
  if (!g) return [] as Paragraph[];
  const scale = Math.min(1, maxW / g.width);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 40 },
      children: [
        new ImageRun({
          data: g.bytes,
          transformation: { width: Math.round(g.width * scale), height: Math.round(g.height * scale) },
        }),
      ],
    }),
  ];
}

export async function exportarWord(a: Analisis, graficos?: GraficosInforme, nombreArchivo = "Informe_Ejecutivo.docx") {
  const t = a.totales;

  // ---------- Tablas ----------
  const kpiTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      headerRow(["Indicador", "Monto"]),
      ...([
        ["Ingresos totales", clp(t.ingresos)],
        ["Egresos totales", clp(t.egresos)],
        ["Flujo neto del período", clp(t.neto)],
        ["Ingresos operacionales", clp(t.ingresosOperacionales)],
        ["Egresos operacionales", clp(t.egresosOperacionales)],
        ["Resultado operacional", clp(t.netoOperacional)],
        ["Traspasos / no operacional", clp(t.traspasos)],
        ["Saldo inicial", t.saldoInicial !== null ? clp(t.saldoInicial) : "—"],
        ["Saldo final", t.saldoFinal !== null ? clp(t.saldoFinal) : "—"],
        ["N° de movimientos", num(t.nMovimientos)],
      ] as [string, string][]).map(([k, v], i) =>
        new TableRow({
          children: [
            cell(k, { bg: i % 2 ? "F1F5F9" : WHITE }),
            cell(v, { align: AlignmentType.RIGHT, bold: true, bg: i % 2 ? "F1F5F9" : WHITE }),
          ],
        })
      ),
    ],
  });

  const mesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      headerRow(["Mes", "Ingresos", "Egresos", "Flujo Neto", "N° Mov."]),
      ...a.porMes.map((m, i) =>
        new TableRow({
          children: [
            cell(m.mesNombre, { bg: i % 2 ? "F1F5F9" : WHITE }),
            cell(clp(m.ingresos), { align: AlignmentType.RIGHT, bg: i % 2 ? "F1F5F9" : WHITE }),
            cell(clp(m.egresos), { align: AlignmentType.RIGHT, bg: i % 2 ? "F1F5F9" : WHITE }),
            cell(clp(m.neto), { align: AlignmentType.RIGHT, bold: true, color: m.neto >= 0 ? "15803D" : "B91C1C", bg: i % 2 ? "F1F5F9" : WHITE }),
            cell(num(m.movimientos), { align: AlignmentType.RIGHT, bg: i % 2 ? "F1F5F9" : WHITE }),
          ],
        })
      ),
      new TableRow({
        children: [
          cell("TOTAL", { bold: true, bg: LIGHT }),
          cell(clp(t.ingresos), { align: AlignmentType.RIGHT, bold: true, bg: LIGHT }),
          cell(clp(t.egresos), { align: AlignmentType.RIGHT, bold: true, bg: LIGHT }),
          cell(clp(t.neto), { align: AlignmentType.RIGHT, bold: true, bg: LIGHT }),
          cell(num(t.nMovimientos), { align: AlignmentType.RIGHT, bold: true, bg: LIGHT }),
        ],
      }),
    ],
  });

  const egrTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      headerRow(["Clasificación", "Egresos", "% del total", "N° Mov."]),
      ...a.topEgresos.map((c, i) =>
        new TableRow({
          children: [
            cell(c.categoria, { bg: i % 2 ? "F1F5F9" : WHITE }),
            cell(clp(c.egresos), { align: AlignmentType.RIGHT, bg: i % 2 ? "F1F5F9" : WHITE }),
            cell(pct(c.egresos, t.egresos), { align: AlignmentType.RIGHT, bg: i % 2 ? "F1F5F9" : WHITE }),
            cell(num(c.movimientos), { align: AlignmentType.RIGHT, bg: i % 2 ? "F1F5F9" : WHITE }),
          ],
        })
      ),
    ],
  });

  const ingTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      headerRow(["Clasificación", "Ingresos", "% del total", "N° Mov."]),
      ...a.topIngresos.map((c, i) =>
        new TableRow({
          children: [
            cell(c.categoria, { bg: i % 2 ? "F1F5F9" : WHITE }),
            cell(clp(c.ingresos), { align: AlignmentType.RIGHT, bg: i % 2 ? "F1F5F9" : WHITE }),
            cell(pct(c.ingresos, t.ingresos), { align: AlignmentType.RIGHT, bg: i % 2 ? "F1F5F9" : WHITE }),
            cell(num(c.movimientos), { align: AlignmentType.RIGHT, bg: i % 2 ? "F1F5F9" : WHITE }),
          ],
        })
      ),
    ],
  });

  // ---------- Cálculos para la narrativa ----------
  const mejorMes = [...a.porMes].sort((x, y) => y.neto - x.neto)[0];
  const peorMes = [...a.porMes].sort((x, y) => x.neto - y.neto)[0];
  const mayorEgreso = a.topEgresos[0];
  const mayorIngreso = a.topIngresos[0];
  const mesesNegativos = a.porMes.filter((m) => m.neto < 0);
  const promedioEgresoMensual = a.porMes.length ? t.egresos / a.porMes.length : 0;
  const concentracionTop3 = a.topEgresos.slice(0, 3).reduce((s, c) => s + c.egresos, 0);

  const resumenTexto =
    `El presente informe analiza la actividad bancaria correspondiente al período ${a.periodo.etiqueta}, ` +
    `sobre la base de ${num(t.nMovimientos)} movimientos clasificados. Durante el período se registraron ingresos ` +
    `totales por ${clp(t.ingresos)} y egresos por ${clp(t.egresos)}, lo que se traduce en un flujo neto de ${clp(t.neto)}. ` +
    `Una vez depurados los traspasos internos y movimientos no operacionales (${clp(t.traspasos)}), el resultado ` +
    `operacional del período asciende a ${clp(t.netoOperacional)}, indicador que refleja con mayor fidelidad la ` +
    `capacidad de generación de caja de la operación.`;

  const interpretacion =
    `${t.netoOperacional >= 0
      ? `El resultado operacional positivo indica que los ingresos propios de la operación fueron suficientes para cubrir la totalidad de los egresos operativos del período, generando un excedente de ${clp(t.netoOperacional)}.`
      : `El resultado operacional negativo (${clp(t.netoOperacional)}) advierte que los egresos operativos superaron a los ingresos de la operación, situación que debe ser monitoreada para resguardar la liquidez.`} ` +
    (mayorEgreso ? `La principal categoría de egreso correspondió a "${mayorEgreso.categoria}", con ${clp(mayorEgreso.egresos)}, equivalente al ${pct(mayorEgreso.egresos, t.egresos)} del gasto total. ` : "") +
    (mayorIngreso ? `Por el lado de los ingresos, la categoría más relevante fue "${mayorIngreso.categoria}" (${clp(mayorIngreso.ingresos)}, ${pct(mayorIngreso.ingresos, t.ingresos)} del total). ` : "");

  // ---------- Observaciones y recomendaciones automáticas ----------
  // Centralizadas en analytics.generarRecomendaciones para mantener una sola
  // fuente de verdad entre la UI y el informe Word.
  const observaciones = a.recomendaciones;

  const narrativaMensual =
    (mejorMes && peorMes
      ? `En cuanto al comportamiento mensual, ${mejorMes.mesNombre} fue el mes de mejor desempeño con un flujo neto de ${clp(mejorMes.neto)}, mientras que ${peorMes.mesNombre} registró el resultado más bajo (${clp(peorMes.neto)}). `
      : "") +
    `El egreso promedio mensual se situó en ${clp(promedioEgresoMensual)}. La siguiente tabla y los gráficos detallan la evolución mes a mes.`;

  // ---------- Documento ----------
  const doc = new Document({
    creator: "Informe Ejecutivo Financiero",
    title: "Informe Ejecutivo Financiero",
    styles: { default: { document: { run: { font: "Segoe UI", size: 20 } } } },
    sections: [
      {
        properties: { page: { margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
        children: [
          // Portada
          new Paragraph({ children: [new TextRun({ text: "INFORME EJECUTIVO FINANCIERO", bold: true, size: 40, color: BRAND })] }),
          new Paragraph({ children: [new TextRun({ text: `Análisis de flujos bancarios · Período: ${a.periodo.etiqueta}`, italics: true, size: 22, color: "555555" })] }),
          new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: `Documento generado el ${a.generadoEl}`, size: 16, color: "999999" })] }),

          // 1. Resumen ejecutivo
          h1("1. Resumen Ejecutivo"),
          p(resumenTexto),
          p(interpretacion),
          h2("Indicadores clave"),
          kpiTable,
          spacer(),

          // 2. Metodología y alcance
          h1("2. Metodología y Alcance"),
          p("El análisis se construye a partir de la cartola bancaria del período, sobre la cual cada movimiento fue clasificado en una categoría contable. La información se procesa íntegramente de forma local, sin almacenamiento en servidores externos."),
          bullet("Fuente: cartola bancaria clasificada (movimientos de cargo y abono)."),
          bullet("Los abonos se consideran ingresos y los cargos, egresos. Las cifras se expresan en pesos chilenos (CLP)."),
          bullet("Se distinguen los movimientos operacionales de los traspasos internos y no operacionales, a fin de no sobrestimar los ingresos y egresos reales de la operación."),
          bullet("Las categorías fueron normalizadas para corregir duplicados y erratas de digitación (por ejemplo, unificando variantes de un mismo proveedor)."),
          spacer(),

          // 3. Análisis de ingresos
          h1("3. Análisis de Ingresos"),
          p(`Los ingresos totales del período alcanzaron ${clp(t.ingresos)}, de los cuales ${clp(t.ingresosOperacionales)} corresponden a la operación y ${clp(t.traspasos)} a traspasos y movimientos no operacionales. La tabla siguiente presenta las principales categorías de ingreso.`),
          ingTable,
          spacer(),

          // 4. Análisis de egresos
          h1("4. Análisis de Egresos"),
          p(`Los egresos totales sumaron ${clp(t.egresos)}. A continuación se presentan las principales categorías de gasto y su distribución porcentual.`),
          egrTable,
          spacer(),
          ...imagen(graficos?.topEgresos),
          ...(graficos?.topEgresos ? [caption("Figura 1. Egresos por clasificación (Top 8).")] : []),
          ...imagen(graficos?.torta),
          ...(graficos?.torta ? [caption("Figura 2. Distribución porcentual de los egresos.")] : []),

          // 5. Evolución mensual
          h1("5. Evolución Mensual"),
          p(narrativaMensual),
          mesTable,
          spacer(),
          ...imagen(graficos?.flujoMensual),
          ...(graficos?.flujoMensual ? [caption("Figura 3. Ingresos versus egresos por mes.")] : []),
          ...imagen(graficos?.flujoNeto),
          ...(graficos?.flujoNeto ? [caption("Figura 4. Evolución del flujo neto mensual.")] : []),

          // 6. Resultado operacional vs traspasos
          h1("6. Resultado Operacional y Traspasos"),
          p(`Para evaluar correctamente el desempeño es necesario aislar los traspasos internos, que no representan generación ni uso real de recursos. Excluyendo ${clp(t.traspasos)} de traspasos y partidas no operacionales, los ingresos operacionales fueron ${clp(t.ingresosOperacionales)} y los egresos operacionales ${clp(t.egresosOperacionales)}, arrojando un resultado operacional de ${clp(t.netoOperacional)}.`),
          spacer(),

          // 7. Observaciones y recomendaciones
          h1("7. Observaciones y Recomendaciones"),
          ...observaciones.map((o) => bullet(o)),
          spacer(),

          // Notas finales
          new Paragraph({
            spacing: { before: 400 },
            children: [new TextRun({ text: "Documento de carácter informativo, elaborado a partir de la cartola bancaria clasificada. Las cifras se expresan en pesos chilenos (CLP) y no constituyen estados financieros auditados.", italics: true, size: 16, color: "999999" })],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, nombreArchivo);
}
