# Informe Ejecutivo Financiero

Aplicación web que convierte una **cartola bancaria clasificada (Excel)** en:

- 📊 **Dashboards interactivos** estilo Power BI (en el navegador)
- 📗 **Informe profesional en Excel** (4 hojas con formato contable)
- 📘 **Informe ejecutivo en Word** (redacción profesional + tablas)
- 📈 **Dataset listo para Power BI Desktop** (CSV tipado + guía con medidas DAX)

> **100% en el navegador. Sin base de datos. Nada se sube a un servidor.**
> Diseñada para desplegarse en **Vercel**.

---

## 🧰 Tecnología

| Capa | Librería |
|------|----------|
| Framework | Next.js 14 (App Router) + React 18 + TypeScript |
| Estilos | Tailwind CSS |
| Lectura Excel | SheetJS (`xlsx`) |
| Escritura Excel | ExcelJS (con formato, colores, filtros) |
| Word | `docx` |
| Gráficos | Recharts |
| Iconos | lucide-react |

---

## 🚀 Uso local

```bash
npm install
npm run dev      # http://localhost:3000
```

Producción local:

```bash
npm run build
npm start
```

---

## ☁️ Desplegar en Vercel

**Opción A — desde la web (más simple):**

1. Sube esta carpeta a un repositorio en GitHub.
2. Entra a [vercel.com](https://vercel.com) → **Add New → Project**.
3. Importa el repo. Vercel detecta Next.js automáticamente.
4. Pulsa **Deploy**. Listo: tendrás una URL pública.

**Opción B — desde la terminal:**

```bash
npm i -g vercel
vercel          # sigue el asistente
vercel --prod   # despliegue a producción
```

No requiere variables de entorno ni base de datos.

---

## 📋 Formato de entrada esperado

Una hoja con las columnas (los nombres son flexibles a tildes/mayúsculas):

`Fecha` · `N° Cartola` · `N° Operación` · `Descripción` · `Cargos` · `Abonos` · `Saldo` · `Clasificación`

La fecha puede venir como `dd/mm`. Las clasificaciones se **normalizan automáticamente**
(se unifican duplicados y erratas, p. ej. *Proveedor/Proveedores*).

---

## 🔁 Flujo de la app

1. **Subes** la cartola → se procesa en tu navegador.
2. **Pestaña "Tablero (Power BI)"** → KPIs y gráficos interactivos.
3. **Pestaña "Informes y Descargas"** → generas y descargas Excel, Word y el dataset de Power BI.
