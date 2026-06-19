import { Movimiento, Analisis, ResumenCategoria, ResumenMes } from "./types";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Genera observaciones y oportunidades de mejora a partir del análisis.
// Centralizado aquí para reutilizarlo en la UI y en el informe Word.
export function generarRecomendaciones(parcial: Omit<Analisis, "recomendaciones">): string[] {
  const t = parcial.totales;
  const recs: string[] = [];
  const mayorEgreso = parcial.topEgresos[0];
  const mayorIngreso = parcial.topIngresos[0];
  const mesesNeg = parcial.porMes.filter((m) => m.neto < 0);
  const promedioEgresoMensual = parcial.porMes.length ? t.egresos / parcial.porMes.length : 0;
  const top3 = parcial.topEgresos.slice(0, 3).reduce((s, c) => s + c.egresos, 0);

  if (t.netoOperacional < 0)
    recs.push(`El resultado operacional del período es deficitario (${clp(t.netoOperacional)}). Revisar la estructura de egresos operativos y evaluar medidas de contención de gasto.`);
  else
    recs.push(`El resultado operacional es positivo (${clp(t.netoOperacional)}): la operación se autofinancia en el período analizado.`);

  if (mayorEgreso && t.egresos && mayorEgreso.egresos / t.egresos > 0.3)
    recs.push(`Alta concentración del gasto en "${mayorEgreso.categoria}" (${pct(mayorEgreso.egresos, t.egresos)} del total). Conviene negociar condiciones y diversificar para reducir la dependencia.`);

  if (t.egresos)
    recs.push(`Las tres principales categorías de egreso concentran ${pct(top3, t.egresos)} del gasto total; priorizar su seguimiento presupuestario.`);

  if (mesesNeg.length > 0)
    recs.push(`Hay ${mesesNeg.length} mes(es) con flujo neto negativo (${mesesNeg.map((m) => m.mesNombre).join(", ")}). Planificar la caja para anticipar estos períodos de mayor presión.`);
  else
    recs.push(`Todos los meses presentaron flujo neto positivo, lo que refleja estabilidad en la generación de caja.`);

  if (t.ingresos && t.traspasos > t.ingresos * 0.2)
    recs.push(`Los traspasos y movimientos no operacionales (${clp(t.traspasos)}) son significativos frente a los ingresos. Mantenerlos separados del análisis operacional para no distorsionar resultados.`);

  if (mayorIngreso && t.ingresos && mayorIngreso.ingresos / t.ingresos > 0.5)
    recs.push(`Los ingresos dependen fuertemente de "${mayorIngreso.categoria}" (${pct(mayorIngreso.ingresos, t.ingresos)}). Evaluar diversificar las fuentes de ingreso para reducir el riesgo de concentración.`);

  const sinClasif = parcial.porCategoria.find((c) => c.categoria === "Sin Clasificar");
  if (sinClasif && (sinClasif.ingresos + sinClasif.egresos) > 0)
    recs.push(`Existen movimientos "Sin Clasificar" (${clp(sinClasif.ingresos + sinClasif.egresos)}). Completar su clasificación mejorará la precisión del análisis.`);

  recs.push(`El egreso promedio mensual fue ${clp(promedioEgresoMensual)}; úselo como referencia base para el presupuesto del próximo período.`);

  return recs;
}

export function analizar(movimientos: Movimiento[], hojas: string[] = []): Analisis {
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

  const base: Omit<Analisis, "recomendaciones"> = {
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
    hojas,
    generadoEl: new Date().toLocaleString("es-CL"),
  };

  return { ...base, recomendaciones: generarRecomendaciones(base) };
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
