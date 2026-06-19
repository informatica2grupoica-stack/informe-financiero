// Consolidacion de clasificaciones: corrige erratas y agrupa duplicados
// detectados en la cartola (criterio contable: unificar mismo concepto).

const MAPA: Record<string, string> = {
  "proveedor": "Proveedores",
  "proveedores": "Proveedores",
  "agente de aduana": "Agente de Aduanas",
  "agente de aduanas": "Agente de Aduanas",
  "electricidad}": "Electricidad",
  "electricidad": "Electricidad",
  "devolicion garantia": "Devolución Garantía",
  "devolucion garantia": "Devolución Garantía",
  "traspaso banco security": "Traspaso Banco Security",
  "giro cajero": "Giro Cajero",
  "tarjeta de credito": "Tarjeta de Crédito",
  "permiso de circulacion": "Permiso de Circulación",
  "importacion": "Importación",
  "comision bancaria": "Comisión Bancaria",
};

// Categorias que NO son operacionales (movimientos internos / financieros).
const TRASPASOS = new Set([
  "Traspaso Banco Security",
  "Devolución Garantía",
]);

export function normalizarCategoria(raw: unknown): string {
  if (raw === null || raw === undefined || String(raw).trim() === "") {
    return "Sin Clasificar";
  }
  const key = String(raw).trim().toLowerCase();
  if (MAPA[key]) return MAPA[key];
  // Title Case por defecto, respetando palabras ya correctas
  return String(raw).trim();
}

export function esTraspaso(categoriaNormalizada: string): boolean {
  return TRASPASOS.has(categoriaNormalizada);
}
