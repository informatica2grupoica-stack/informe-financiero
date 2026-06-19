import * as XLSX from "xlsx";
import { Movimiento } from "./types";
import { normalizarCategoria, esTraspaso } from "./normalize";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Encabezados esperados (flexibles a tildes/mayusculas)
function findCol(headers: string[], candidates: string[]): number {
  const norm = (s: unknown) =>
    String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  // Array.from densifica: las cabeceras pueden venir como array disperso
  // (huecos) cuando una columna no tiene título, lo que dejaría H[i] = undefined.
  const H = Array.from({ length: headers.length }, (_, i) => norm(headers[i]));
  for (const c of candidates) {
    const i = H.indexOf(norm(c));
    if (i >= 0) return i;
  }
  // match parcial
  for (let i = 0; i < H.length; i++) {
    if (H[i] && candidates.some((c) => H[i].includes(norm(c)))) return i;
  }
  return -1;
}

function toNumber(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(/\./g, "").replace(/,/g, ".").replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

export type ParseResult = { movimientos: Movimiento[]; anioBase: number; hojas: string[] };

// Lista los nombres de las pestañas (hojas) del libro, para que el usuario
// pueda elegir una o varias antes de procesar.
export function listSheets(data: ArrayBuffer): string[] {
  const wb = XLSX.read(data, { type: "array", bookSheets: true });
  return wb.SheetNames.slice();
}

// Procesa UNA hoja y devuelve sus movimientos. Devuelve [] si la hoja no tiene
// el formato esperado (para no romper cuando se seleccionan varias pestañas).
function parseSheet(ws: XLSX.WorkSheet, hoja: string, anioBase: number): Movimiento[] {
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
  if (!rows.length) return [];

  // Detectar fila de encabezado (primera fila con 'Fecha')
  let headerRow = 0;
  let found = false;
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const joined = (rows[i] || []).map((c) => String(c ?? "").toLowerCase()).join("|");
    if (joined.includes("fecha")) { headerRow = i; found = true; break; }
  }
  if (!found) return [];

  const headers = (rows[headerRow] || []).map((c) => String(c ?? ""));

  const cFecha = findCol(headers, ["Fecha"]);
  const cCartola = findCol(headers, ["N Cartola", "Cartola"]);
  const cOper = findCol(headers, ["N Operacion", "Operacion"]);
  const cDesc = findCol(headers, ["Descripcion", "Glosa", "Detalle"]);
  const cCargo = findCol(headers, ["Cargos", "Cargo", "Debito"]);
  const cAbono = findCol(headers, ["Abonos", "Abono", "Credito"]);
  const cSaldo = findCol(headers, ["Saldo"]);
  const cClasif = findCol(headers, ["Clasificacion", "Categoria"]);

  if (cFecha < 0 || cClasif < 0) return [];

  const movimientos: Movimiento[] = [];
  for (let i = headerRow + 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const fechaRaw = r[cFecha];
    if (fechaRaw === null || fechaRaw === undefined || String(fechaRaw).trim() === "") continue;

    // Fecha viene como "dd/mm"
    let mes = 1, dia = 1;
    const m = String(fechaRaw).match(/(\d{1,2})[\/\-](\d{1,2})/);
    if (m) { dia = parseInt(m[1], 10); mes = parseInt(m[2], 10); }
    if (mes < 1 || mes > 12) mes = 1;

    const cargo = cCargo >= 0 ? toNumber(r[cCargo]) : 0;
    const abono = cAbono >= 0 ? toNumber(r[cAbono]) : 0;
    if (cargo === 0 && abono === 0) continue; // fila sin importe

    const clasifOriginal = cClasif >= 0 ? String(r[cClasif] ?? "Sin Clasificar") : "Sin Clasificar";
    const clasificacion = normalizarCategoria(r[cClasif]);
    const tipo = abono > 0 ? "Ingreso" : "Egreso";

    movimientos.push({
      fecha: String(fechaRaw),
      fechaISO: `${anioBase}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`,
      mes,
      mesNombre: MESES[mes - 1],
      nCartola: cCartola >= 0 ? Number(r[cCartola]) || null : null,
      nOperacion: cOper >= 0 ? Number(r[cOper]) || null : null,
      descripcion: cDesc >= 0 ? String(r[cDesc] ?? "").trim() : "",
      cargo,
      abono,
      saldo: cSaldo >= 0 ? (toNumber(r[cSaldo]) || null) : null,
      clasificacion,
      clasificacionOriginal: clasifOriginal,
      tipo,
      esTraspaso: esTraspaso(clasificacion),
      hoja,
    });
  }
  return movimientos;
}

// Procesa el libro. Si se entregan `sheetNames`, se combinan los movimientos
// de todas las hojas seleccionadas; si no, se usa la primera hoja.
export function parseWorkbook(data: ArrayBuffer, sheetNames?: string[]): ParseResult {
  const wb = XLSX.read(data, { type: "array" });
  const todas = wb.SheetNames.slice();
  const seleccion =
    sheetNames && sheetNames.length
      ? sheetNames.filter((n) => todas.includes(n))
      : [todas[0]];

  if (!seleccion.length) throw new Error("No se seleccionó ninguna pestaña válida.");

  const anioBase = new Date().getFullYear();
  const movimientos: Movimiento[] = [];
  const hojasConDatos: string[] = [];
  for (const nombre of seleccion) {
    const ws = wb.Sheets[nombre];
    if (!ws) continue;
    const movs = parseSheet(ws, nombre, anioBase);
    if (movs.length) { movimientos.push(...movs); hojasConDatos.push(nombre); }
  }

  if (!movimientos.length) {
    throw new Error(
      "No se encontraron movimientos con importe en la(s) pestaña(s) seleccionada(s). " +
      "Verifica que tengan columnas 'Fecha' y 'Clasificacion'."
    );
  }
  return { movimientos, anioBase, hojas: hojasConDatos };
}
