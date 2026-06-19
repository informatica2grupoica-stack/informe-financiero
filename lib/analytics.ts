import { Movimiento, Analisis, ResumenCategoria, ResumenMes } from "./types";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function analizar(movimientos: Movimiento[]): Analisis {
  // ---- Totales ----
  let ingresos = 0, egresos = 0;
  let ingresosOp = 0, egresosOp = 0, traspasos = 0;

  for (const m of movimientos) {
    ingresos += m.abono;
    egresos += m.cargo;
    if (m.esTraspaso) {
      traspasos += m.abono + m.cargo;
    } else {
      ingresosOp += m.abono;
      egresosOp += m.cargo;
    }
  }

  // ---- Por categoria ----
  const catMap = new Map<string, ResumenCategoria>();
  for (const m of movimientos) {
    const c = catMap.get(m.clasificacion) ?? {
      categoria: m.clasificacion, ingresos: 0, egresos: 0, neto: 0, movimientos: 0,
    };
    c.ingresos += m.abono;
    c.egresos += m.cargo;
    c.neto = c.ingresos - c.egresos;
    c.movimientos += 1;
    catMap.set(m.clasificacion, c);
  }
  const porCategoria = [...catMap.values()].sort(
    (a, b) => b.egresos + b.ingresos - (a.egresos + a.ingresos)
  );

  // ---- Por mes ----
  const mesMap = new Map<number, ResumenMes>();
  for (const m of movimientos) {
    const c = mesMap.get(m.mes) ?? {
      mes: m.mes, mesNombre: MESES[m.mes - 1], ingresos: 0, egresos: 0, neto: 0, movimientos: 0,
    };
    c.ingresos += m.abono;
    c.egresos += m.cargo;
    c.neto = c.ingresos - c.egresos;
    c.movimientos += 1;
    mesMap.set(m.mes, c);
  }
  const porMes = [...mesMap.values()].sort((a, b) => a.mes - b.mes);

  // ---- Saldos (primer y ultimo con saldo) ----
  let saldoInicial: number | null = null;
  let saldoFinal: number | null = null;
  for (const m of movimientos) {
    if (m.saldo !== null) { saldoInicial = m.saldo; break; }
  }
  for (let i = movimientos.length - 1; i >= 0; i--) {
    if (movimientos[i].saldo !== null) { saldoFinal = movimientos[i].saldo; break; }
  }

  // ---- Periodo ----
  const meses = porMes.map((p) => p.mes);
  const desde = meses.length ? MESES[Math.min(...meses) - 1] : "";
  const hasta = meses.length ? MESES[Math.max(...meses) - 1] : "";

  const topEgresos = [...porCategoria]
    .filter((c) => c.egresos > 0)
    .sort((a, b) => b.egresos - a.egresos)
    .slice(0, 10);

  const topIngresos = [...porCategoria]
    .filter((c) => c.ingresos > 0)
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 10);

  return {
    movimientos,
    periodo: { desde, hasta, etiqueta: desde === hasta ? desde : `${desde} - ${hasta}` },
    totales: {
      ingresos, egresos, neto: ingresos - egresos,
      ingresosOperacionales: ingresosOp,
      egresosOperacionales: egresosOp,
      netoOperacional: ingresosOp - egresosOp,
      traspasos,
      nMovimientos: movimientos.length,
      saldoInicial, saldoFinal,
    },
    porCategoria,
    porMes,
    topEgresos,
    topIngresos,
    generadoEl: new Date().toLocaleString("es-CL"),
  };
}

// ---- Formateadores ----
export function clp(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(n);
}

export function num(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(n);
}

export function pct(part: number, total: number): string {
  if (!total) return "0%";
  return ((part / total) * 100).toFixed(1) + "%";
}
