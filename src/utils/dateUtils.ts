// src/utils/dateUtils.ts
// Fuente única de verdad para todas las conversiones de fecha del proyecto

/** yyyy-mm-dd -> dd/mm/yyyy */
export function isoToDDMMYYYY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || "").trim());
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** dd/mm/yyyy -> yyyy-mm-dd */
export function ddmmyyyyToISO(ddmmyyyy: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(ddmmyyyy || "").trim());
  if (!m) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Excel serial number -> dd/mm/yyyy */
export function convertirFechaExcel(fechaSerial: number): string {
  const fecha = new Date(Math.round((fechaSerial - 25569) * 86400 * 1000));
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

/** Convierte cualquier formato de fecha (Excel serial / ISO / dd/mm/yyyy) a dd/mm/yyyy */
export function obtenerFechaAtencionDDMMYYYY(raw: unknown): string {
  if (typeof raw === "number") return convertirFechaExcel(raw);
  if (typeof raw === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  if (typeof raw === "string" && !isNaN(Date.parse(raw))) {
    const fecha = new Date(raw);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }
  return "01/01/1900";
}

/** dd/mm/yyyy -> Date (null si la fecha es inválida) */
export function parseFechaDDMMYYYY(fecha: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(fecha || "").trim());
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  const d = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

/** true si la fecha en formato dd/mm/yyyy es futura */
export function esFechaFutura(fechaDDMMYYYY: string): boolean {
  const d = parseFechaDDMMYYYY(fechaDDMMYYYY);
  if (!d) return true;
  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12, 0, 0, 0);
  return d.getTime() > hoySinHora.getTime();
}

/** Formatea una fecha ISO o similar para mostrar en pantalla (zona horaria Perú) */
export function formatoFechaDisplay(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("es-PE", { timeZone: "America/Lima" });
}
