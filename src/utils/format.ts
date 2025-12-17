// src/utils/format.ts

// Teléfono Perú con espacios NO separables
export const formatTelefonoPE = (v?: string | number) => {
  const d = String(v ?? "").replace(/\D+/g, "");
  if (d.length !== 9) return String(v ?? "");
  const sep = "\u202F"; // espacio angosto no separable (mejor que NBSP)
  return `${d.slice(0, 3)}${sep}${d.slice(3, 6)}${sep}${d.slice(6)}`;
};

/** Convierte números Excel serial a Date (UTC) */
const fromExcelSerial = (n: number) => {
  const msUTC = Math.round((n - 25569) * 86400 * 1000);
  return new Date(msUTC);
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const dmyUTC = (d: Date) =>
  `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;

/**
 * Formatea a DD/MM/AAAA aceptando:
 * - "DD/MM/AAAA" => lo deja igual
 * - "YYYY-MM-DD" o ISO => lo convierte
 * - timestamp ms/segundos => lo convierte (UTC)
 * - Excel serial (≈ >60 y < 100000) => lo convierte (UTC)
 * - Cualquier otro string => se devuelve tal cual
 */
export const formatFechaDMY = (v?: string | number | Date) => {
  if (v === undefined || v === null) return "";

  // Ya en formato esperado
  if (typeof v === "string") {
    const s = v.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s; // DD/MM/AAAA

    // YYYY-MM-DD (con o sin tiempo)
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
      return dmyUTC(d);
    }

    // Intento genérico (ISO u otros parseables)
    const t = Date.parse(s);
    if (!Number.isNaN(t)) return dmyUTC(new Date(t));

    return s; // string no reconocible: lo dejamos
  }

  if (v instanceof Date) {
    return dmyUTC(v);
  }

  // Number
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);

  // Heurísticas:
  // - ms desde epoch: > 1e12
  if (n > 1e12) return dmyUTC(new Date(n));
  // - seg desde epoch: entre 1e9 y 1e12
  if (n > 1e9) return dmyUTC(new Date(n * 1000));
  // - Excel serial: típico entre 60 y 100000
  if (n > 60 && n < 100000) return dmyUTC(fromExcelSerial(n));

  return String(v);
};
