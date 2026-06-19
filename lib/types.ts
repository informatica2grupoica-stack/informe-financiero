export type Movimiento = {
  fecha: string;        // texto original "dd/mm"
  fechaISO: string;     // "2026-01-02" (asume el año del periodo)
  mes: number;          // 1..12
  mesNombre: string;    // "Enero"
  nCartola: number | null;
  nOperacion: number | null;
  descripcion: string;
  cargo: number;        // egreso (positivo)
  abono: number;        // ingreso (positivo)
  saldo: number | null;
  clasificacion: string;      // normalizada
  clasificacionOriginal: string;
  tipo: "Ingreso" | "Egreso";
  esTraspaso: boolean;  // movimiento no operacional (traspasos internos)
  hoja: string;         // pestaña de origen
};

export type ResumenCategoria = {
  categoria: string;
  ingresos: number;
  egresos: number;
  neto: number;
  movimientos: number;
};

export type ResumenMes = {
  mes: number;
  mesNombre: string;
  ingresos: number;
  egresos: number;
  neto: number;
  movimientos: number;
};

export type Analisis = {
  movimientos: Movimiento[];
  periodo: { desde: string; hasta: string; etiqueta: string };
  totales: {
    ingresos: number;
    egresos: number;
    neto: number;
    ingresosOperacionales: number;
    egresosOperacionales: number;
    netoOperacional: number;
    traspasos: number;
    nMovimientos: number;
    saldoInicial: number | null;
    saldoFinal: number | null;
  };
  porCategoria: ResumenCategoria[];
  porMes: ResumenMes[];
  topEgresos: ResumenCategoria[];
  topIngresos: ResumenCategoria[];
  hojas: string[];           // pestañas analizadas
  recomendaciones: string[]; // observaciones y mejoras automáticas
  generadoEl: string;
};
