import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Analisis } from "./types";
import { ChartImg } from "./chartImages";

export type GraficosInforme = {
  flujoMensual: ChartImg;
  flujoNeto: ChartImg;
  topEgresos: ChartImg;
  torta: ChartImg;
};

const BRAND = "FF1F4E79";
const BRAND_LIGHT = "FFD9E6FF";
const INGRESO = "FF15803D";
const EGRESO = "FFB91C1C";
const GRAY = "FFF1F5F9";

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      bottom: { style: "thin", color: { argb: BRAND } },
    };
  });
  row.height = 22;
}

const MONEY = '#,##0;[Red]-#,##0';

export async function exportarExcel(
  a: Analisis,
  graficos?: GraficosInforme,
  nombreArchivo = "Informe_Ejecutivo.xlsx"
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Informe Ejecutivo Financiero";
  wb.created = new Date();

  // ============ HOJA: DASHBOARD (gráficos del tablero) ============
  if (graficos) {
    const wdash = wb.addWorksheet("Dashboard", { views: [{ showGridLines: false }] });
    wdash.columns = [{ width: 3 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 3 }];

    wdash.mergeCells("B2:I2");
    const dt = wdash.getCell("B2");
    dt.value = "TABLERO DE CONTROL FINANCIERO";
    dt.font = { bold: true, size: 18, color: { argb: BRAND } };
    wdash.mergeCells("B3:I3");
    const ds = wdash.getCell("B3");
    ds.value = `Período: ${a.periodo.etiqueta}  ·  Generado: ${a.generadoEl}`;
    ds.font = { italic: true, size: 10, color: { argb: "FF666666" } };

    // Fila de tarjetas KPI
    const kpiRow = 5;
    const tarjetas: [string, number, string][] = [
      ["INGRESOS", a.totales.ingresos, INGRESO],
      ["EGRESOS", a.totales.egresos, EGRESO],
      ["FLUJO NETO", a.totales.neto, a.totales.neto >= 0 ? INGRESO : EGRESO],
      ["NETO OPERACIONAL", a.totales.netoOperacional, a.totales.netoOperacional >= 0 ? INGRESO : EGRESO],
    ];
    const cols = ["B", "D", "F", "H"];
    tarjetas.forEach(([label, value, color], i) => {
      const c0 = cols[i];
      const c1 = String.fromCharCode(c0.charCodeAt(0) + 1);
      wdash.mergeCells(`${c0}${kpiRow}:${c1}${kpiRow}`);
      wdash.mergeCells(`${c0}${kpiRow + 1}:${c1}${kpiRow + 1}`);
      const lc = wdash.getCell(`${c0}${kpiRow}`);
      lc.value = label;
      lc.font = { bold: true, size: 9, color: { argb: "FFFFFFFF" } };
      lc.alignment = { horizontal: "center", vertical: "middle" };
      lc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
      const vc = wdash.getCell(`${c0}${kpiRow + 1}`);
      vc.value = value;
      vc.numFmt = MONEY;
      vc.font = { bold: true, size: 14, color: { argb: color } };
      vc.alignment = { horizontal: "center", vertical: "middle" };
      vc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRAY } };
      wdash.getRow(kpiRow).height = 18;
      wdash.getRow(kpiRow + 1).height = 30;
    });

    // Inserta los gráficos apilados verticalmente (sin solapes).
    // El ancla tl usa índices de fila/columna; ~15px por fila por defecto.
    const ROWS_PER_CHART = 22;
    let anchorRow = 8;
    const place = (g: ChartImg) => {
      const id = wb.addImage({ base64: g.dataUrl, extension: "png" });
      wdash.addImage(id, {
        tl: { col: 1, row: anchorRow } as any,
        ext: { width: g.width, height: g.height },
      });
      anchorRow += ROWS_PER_CHART;
    };
    [graficos.flujoMensual, graficos.flujoNeto, graficos.topEgresos, graficos.torta].forEach(place);
  }

  // ============ HOJA 1: RESUMEN EJECUTIVO ============
  const ws = wb.addWorksheet("Resumen Ejecutivo", {
    views: [{ showGridLines: false }],
  });
  ws.columns = [
    { width: 4 }, { width: 38 }, { width: 22 }, { width: 16 }, { width: 22 },
  ];

  ws.mergeCells("B2:E2");
  const title = ws.getCell("B2");
  title.value = "INFORME EJECUTIVO FINANCIERO";
  title.font = { bold: true, size: 18, color: { argb: BRAND } };
  ws.mergeCells("B3:E3");
  const sub = ws.getCell("B3");
  sub.value = `Análisis de flujos · Período: ${a.periodo.etiqueta}`;
  sub.font = { italic: true, size: 11, color: { argb: "FF555555" } };
  ws.mergeCells("B4:E4");
  ws.getCell("B4").value = `Generado: ${a.generadoEl}`;
  ws.getCell("B4").font = { size: 9, color: { argb: "FF888888" } };

  // KPIs
  let r = 6;
  const kpis: [string, number, string][] = [
    ["Ingresos totales", a.totales.ingresos, INGRESO],
    ["Egresos totales", a.totales.egresos, EGRESO],
    ["Flujo neto", a.totales.neto, a.totales.neto >= 0 ? INGRESO : EGRESO],
    ["Ingresos operacionales", a.totales.ingresosOperacionales, INGRESO],
    ["Egresos operacionales", a.totales.egresosOperacionales, EGRESO],
    ["Neto operacional", a.totales.netoOperacional, a.totales.netoOperacional >= 0 ? INGRESO : EGRESO],
    ["Traspasos / no operacional", a.totales.traspasos, "FF555555"],
    ["N° de movimientos", a.totales.nMovimientos, BRAND],
  ];
  ws.getCell(`B${r}`).value = "INDICADORES CLAVE";
  ws.getCell(`B${r}`).font = { bold: true, size: 12, color: { argb: BRAND } };
  r++;
  for (const [label, value, color] of kpis) {
    ws.getCell(`B${r}`).value = label;
    ws.getCell(`B${r}`).font = { size: 11 };
    const c = ws.getCell(`C${r}`);
    c.value = value;
    c.numFmt = label.startsWith("N°") ? "#,##0" : MONEY;
    c.font = { bold: true, size: 11, color: { argb: color } };
    c.alignment = { horizontal: "right" };
    ws.getRow(r).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: r % 2 ? GRAY : "FFFFFFFF" } };
    });
    r++;
  }

  if (a.totales.saldoInicial !== null || a.totales.saldoFinal !== null) {
    r++;
    ws.getCell(`B${r}`).value = "Saldo inicial";
    ws.getCell(`C${r}`).value = a.totales.saldoInicial ?? 0;
    ws.getCell(`C${r}`).numFmt = MONEY;
    r++;
    ws.getCell(`B${r}`).value = "Saldo final";
    ws.getCell(`C${r}`).value = a.totales.saldoFinal ?? 0;
    ws.getCell(`C${r}`).numFmt = MONEY;
    ws.getCell(`C${r}`).font = { bold: true };
  }

  // ============ HOJA 2: FLUJO MENSUAL ============
  const wm = wb.addWorksheet("Flujo Mensual");
  wm.columns = [
    { header: "Mes", key: "mes", width: 16 },
    { header: "Ingresos", key: "ing", width: 18 },
    { header: "Egresos", key: "egr", width: 18 },
    { header: "Flujo Neto", key: "neto", width: 18 },
    { header: "N° Mov.", key: "n", width: 12 },
  ];
  styleHeader(wm.getRow(1));
  for (const m of a.porMes) {
    const row = wm.addRow({ mes: m.mesNombre, ing: m.ingresos, egr: m.egresos, neto: m.neto, n: m.movimientos });
    row.getCell("ing").numFmt = MONEY;
    row.getCell("egr").numFmt = MONEY;
    row.getCell("neto").numFmt = MONEY;
    row.getCell("neto").font = { color: { argb: m.neto >= 0 ? INGRESO : EGRESO }, bold: true };
  }
  const totM = wm.addRow({
    mes: "TOTAL",
    ing: a.totales.ingresos, egr: a.totales.egresos, neto: a.totales.neto, n: a.totales.nMovimientos,
  });
  totM.eachCell((c) => {
    c.font = { bold: true };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_LIGHT } };
  });
  ["ing", "egr", "neto"].forEach((k) => (totM.getCell(k).numFmt = MONEY));

  // ============ HOJA 3: POR CATEGORIA ============
  const wc = wb.addWorksheet("Por Categoría");
  wc.columns = [
    { header: "Clasificación", key: "cat", width: 32 },
    { header: "Ingresos", key: "ing", width: 18 },
    { header: "Egresos", key: "egr", width: 18 },
    { header: "Neto", key: "neto", width: 18 },
    { header: "% Egresos", key: "pct", width: 12 },
    { header: "N° Mov.", key: "n", width: 12 },
  ];
  styleHeader(wc.getRow(1));
  for (const c of a.porCategoria) {
    const row = wc.addRow({
      cat: c.categoria, ing: c.ingresos, egr: c.egresos, neto: c.neto,
      pct: a.totales.egresos ? c.egresos / a.totales.egresos : 0,
      n: c.movimientos,
    });
    row.getCell("ing").numFmt = MONEY;
    row.getCell("egr").numFmt = MONEY;
    row.getCell("neto").numFmt = MONEY;
    row.getCell("pct").numFmt = "0.0%";
  }

  // ============ HOJA 4: DETALLE ============
  const wd = wb.addWorksheet("Detalle Movimientos");
  wd.columns = [
    { header: "Fecha", key: "fecha", width: 10 },
    { header: "N° Cartola", key: "cart", width: 11 },
    { header: "N° Operación", key: "op", width: 14 },
    { header: "Descripción", key: "desc", width: 42 },
    { header: "Cargo", key: "cargo", width: 16 },
    { header: "Abono", key: "abono", width: 16 },
    { header: "Saldo", key: "saldo", width: 16 },
    { header: "Clasificación", key: "clasif", width: 26 },
  ];
  styleHeader(wd.getRow(1));
  wd.autoFilter = "A1:H1";
  wd.views = [{ state: "frozen", ySplit: 1 }];
  for (const m of a.movimientos) {
    const row = wd.addRow({
      fecha: m.fecha, cart: m.nCartola, op: m.nOperacion, desc: m.descripcion,
      cargo: m.cargo || null, abono: m.abono || null, saldo: m.saldo, clasif: m.clasificacion,
    });
    ["cargo", "abono", "saldo"].forEach((k) => (row.getCell(k).numFmt = MONEY));
    if (m.abono > 0) row.getCell("abono").font = { color: { argb: INGRESO } };
    if (m.cargo > 0) row.getCell("cargo").font = { color: { argb: EGRESO } };
  }

  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), nombreArchivo);
}
