// Renderiza los graficos del tablero a imagenes PNG (canvas) para poder
// incrustarlos tanto en el Excel (ExcelJS) como en el Word (docx).
import { Analisis } from "./types";

export type ChartImg = { dataUrl: string; bytes: Uint8Array; width: number; height: number };

const BRAND = "#1f4e79";
const INGRESO = "#15803d";
const EGRESO = "#b91c1c";
const PALETTE = ["#1f4e79", "#2e86c1", "#48c9b0", "#f4d03f", "#eb984e", "#cb4335", "#884ea0", "#5d6d7e", "#16a085", "#d35400"];

function compact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toLocaleString("es-CL", { maximumFractionDigits: 1 }) + "M";
  if (abs >= 1_000) return (n / 1_000).toLocaleString("es-CL", { maximumFractionDigits: 0 }) + "K";
  return n.toLocaleString("es-CL");
}

function newCanvas(w: number, h: number) {
  const scale = 2;
  const c = document.createElement("canvas");
  c.width = w * scale;
  c.height = h * scale;
  const ctx = c.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.textBaseline = "alphabetic";
  ctx.font = "12px 'Segoe UI', Arial, sans-serif";
  // fondo blanco
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  return { c, ctx };
}

function toImg(c: HTMLCanvasElement, w: number, h: number): ChartImg {
  const dataUrl = c.toDataURL("image/png");
  const bin = atob(dataUrl.split(",")[1]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { dataUrl, bytes, width: w, height: h };
}

function title(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 15px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(text, x, y);
  ctx.font = "12px 'Segoe UI', Arial, sans-serif";
}

// ---------- Barras agrupadas: Ingresos vs Egresos por mes ----------
export function chartFlujoMensual(a: Analisis): ChartImg {
  const W = 620, H = 320;
  const { c, ctx } = newCanvas(W, H);
  title(ctx, "Flujo mensual: Ingresos vs Egresos", 20, 28);

  const padL = 60, padR = 20, padT = 50, padB = 60;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const data = a.porMes;
  const max = Math.max(1, ...data.map((d) => Math.max(d.ingresos, d.egresos)));

  // grid + eje Y
  ctx.strokeStyle = "#eef2f7"; ctx.fillStyle = "#94a3b8";
  ctx.font = "10px 'Segoe UI', Arial, sans-serif"; ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const y = padT + plotH - (plotH * i) / 4;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillText(compact((max * i) / 4), padL - 6, y + 3);
  }
  ctx.textAlign = "center";

  const groupW = plotW / data.length;
  const barW = Math.min(26, groupW / 3);
  data.forEach((d, i) => {
    const cx = padL + groupW * i + groupW / 2;
    const hi = (d.ingresos / max) * plotH;
    const he = (d.egresos / max) * plotH;
    ctx.fillStyle = INGRESO; ctx.fillRect(cx - barW - 2, padT + plotH - hi, barW, hi);
    ctx.fillStyle = EGRESO; ctx.fillRect(cx + 2, padT + plotH - he, barW, he);
    ctx.fillStyle = "#475569"; ctx.font = "11px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(d.mesNombre.slice(0, 3), cx, padT + plotH + 16);
  });

  // leyenda
  ctx.textAlign = "left";
  ctx.fillStyle = INGRESO; ctx.fillRect(padL, H - 22, 12, 12);
  ctx.fillStyle = "#475569"; ctx.fillText("Ingresos", padL + 18, H - 12);
  ctx.fillStyle = EGRESO; ctx.fillRect(padL + 100, H - 22, 12, 12);
  ctx.fillStyle = "#475569"; ctx.fillText("Egresos", padL + 118, H - 12);

  return toImg(c, W, H);
}

// ---------- Linea: flujo neto por mes ----------
export function chartFlujoNeto(a: Analisis): ChartImg {
  const W = 620, H = 300;
  const { c, ctx } = newCanvas(W, H);
  title(ctx, "Evolución del flujo neto", 20, 28);

  const padL = 60, padR = 20, padT = 50, padB = 40;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const data = a.porMes;
  const vals = data.map((d) => d.neto);
  const max = Math.max(1, ...vals), min = Math.min(0, ...vals);
  const range = max - min || 1;
  const yOf = (v: number) => padT + plotH - ((v - min) / range) * plotH;

  ctx.strokeStyle = "#eef2f7"; ctx.fillStyle = "#94a3b8";
  ctx.font = "10px 'Segoe UI', Arial, sans-serif"; ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const v = min + (range * i) / 4; const y = yOf(v);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillText(compact(v), padL - 6, y + 3);
  }
  // linea cero
  const yZero = yOf(0);
  ctx.strokeStyle = "#cbd5e1"; ctx.beginPath(); ctx.moveTo(padL, yZero); ctx.lineTo(W - padR, yZero); ctx.stroke();

  const stepX = plotW / Math.max(1, data.length - 1);
  ctx.strokeStyle = BRAND; ctx.lineWidth = 3; ctx.beginPath();
  data.forEach((d, i) => {
    const x = padL + stepX * i, y = yOf(d.neto);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke(); ctx.lineWidth = 1;
  ctx.textAlign = "center";
  data.forEach((d, i) => {
    const x = padL + stepX * i, y = yOf(d.neto);
    ctx.fillStyle = d.neto >= 0 ? INGRESO : EGRESO;
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#475569"; ctx.font = "11px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(d.mesNombre.slice(0, 3), x, padT + plotH + 16);
  });
  return toImg(c, W, H);
}

// ---------- Barras horizontales: top egresos ----------
export function chartTopEgresos(a: Analisis): ChartImg {
  const data = a.topEgresos.slice(0, 8);
  const W = 620, H = 40 + data.length * 34 + 20;
  const { c, ctx } = newCanvas(W, H);
  title(ctx, "Egresos por clasificación (Top 8)", 20, 28);

  const padL = 160, padR = 70, padT = 44;
  const plotW = W - padL - padR;
  const max = Math.max(1, ...data.map((d) => d.egresos));
  const rowH = 30;
  ctx.font = "12px 'Segoe UI', Arial, sans-serif";
  data.forEach((d, i) => {
    const y = padT + i * (rowH + 4);
    const w = (d.egresos / max) * plotW;
    ctx.fillStyle = "#475569"; ctx.textAlign = "right";
    const label = d.categoria.length > 22 ? d.categoria.slice(0, 21) + "…" : d.categoria;
    ctx.fillText(label, padL - 8, y + rowH / 2 + 4);
    ctx.fillStyle = PALETTE[i % PALETTE.length];
    ctx.fillRect(padL, y, Math.max(2, w), rowH);
    ctx.fillStyle = "#1e293b"; ctx.textAlign = "left";
    ctx.fillText(compact(d.egresos), padL + Math.max(2, w) + 6, y + rowH / 2 + 4);
  });
  return toImg(c, W, H);
}

// ---------- Torta: distribucion de egresos ----------
export function chartTortaEgresos(a: Analisis): ChartImg {
  const data = a.topEgresos.slice(0, 7);
  const otros = a.topEgresos.slice(7).reduce((s, d) => s + d.egresos, 0);
  const slices = otros > 0 ? [...data, { categoria: "Otros", egresos: otros }] : data;
  const total = slices.reduce((s, d) => s + d.egresos, 0) || 1;

  const W = 620, H = 340;
  const { c, ctx } = newCanvas(W, H);
  title(ctx, "Distribución de egresos", 20, 28);

  const cx = 160, cy = 185, R = 110, r = 55;
  let ang = -Math.PI / 2;
  slices.forEach((d, i) => {
    const a2 = ang + (d.egresos / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, ang, a2); ctx.closePath();
    ctx.fillStyle = PALETTE[i % PALETTE.length]; ctx.fill();
    ang = a2;
  });
  // dona
  ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

  // leyenda
  ctx.textAlign = "left"; ctx.font = "12px 'Segoe UI', Arial, sans-serif";
  let ly = 70;
  slices.forEach((d, i) => {
    ctx.fillStyle = PALETTE[i % PALETTE.length]; ctx.fillRect(330, ly, 12, 12);
    ctx.fillStyle = "#475569";
    const p = ((d.egresos / total) * 100).toFixed(1);
    const label = d.categoria.length > 24 ? d.categoria.slice(0, 23) + "…" : d.categoria;
    ctx.fillText(`${label}  ${p}%`, 350, ly + 11);
    ly += 26;
  });
  return toImg(c, W, H);
}

export function generarGraficos(a: Analisis) {
  return {
    flujoMensual: chartFlujoMensual(a),
    flujoNeto: chartFlujoNeto(a),
    topEgresos: chartTopEgresos(a),
    torta: chartTortaEgresos(a),
  };
}
