// src/utils/formUtils.ts
import { Contacto } from "../domain/entities/contact";

const digits = (v: unknown) => String(v ?? "").replace(/\D+/g, "");

type RequiredKeys =
  | "primerNombre"
  | "primerApellido"
  | "area"
  | "fechaAtencion"
  | "operador"
  | "telefono"
  | "marca"
  | "modelo"
  | "serie"
  | "categoria";

// ✅ Solo letras/espacios (con tildes) en mayúsculas
const SOLO_LETRAS = /^[A-ZÁÉÍÓÚÑ ]+$/;

// ✅ Categorías válidas 2026
const CATEGORIAS_PERMITIDAS = ["parlamento", "diputado", "senador"] as const;
type CategoriaPermitida = (typeof CATEGORIAS_PERMITIDAS)[number];

// ✅ Parse seguro de fecha: soporta YYYY-MM-DD y DD/MM/YYYY
function parseFecha(fechaStr: string): Date | null {
  const s = String(fechaStr ?? "").trim();
  if (!s) return null;

  // YYYY-MM-DD
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) {
    const yyyy = Number(iso[1]);
    const mm = Number(iso[2]);
    const dd = Number(iso[3]);
    const d = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
    if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) {
      return null;
    }
    return d;
  }

  // DD/MM/YYYY
  const latam = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (latam) {
    const dd = Number(latam[1]);
    const mm = Number(latam[2]);
    const yyyy = Number(latam[3]);
    const d = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
    if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) {
      return null;
    }
    return d;
  }

  return null;
}

export function validarContacto(
  contacto: Contacto,
  contactos: Contacto[],
  modoEdicion: boolean,
  idEdicion: string | null
): string | null {
  // 1) Requeridos
  const camposObligatorios: Array<RequiredKeys> = [
    "primerNombre",
    "primerApellido",
    "area",
    "fechaAtencion",
    "operador",
    "telefono",
    "marca",
    "modelo",
    "serie",
    "categoria",
  ];

  for (const campo of camposObligatorios) {
    const valor = contacto[campo];
    if (
      valor === undefined ||
      valor === null ||
      (typeof valor === "string" && valor.trim() === "")
    ) {
      return `El campo "${campo}" es obligatorio.`;
    }
  }

  // 2) Nombres y apellidos: solo letras y espacios
  const pn = String(contacto.primerNombre ?? "").toUpperCase().trim();
  const sn = String(contacto.segundoNombre ?? "").toUpperCase().trim();
  const pa = String(contacto.primerApellido ?? "").toUpperCase().trim();
  const sa = String(contacto.segundoApellido ?? "").toUpperCase().trim();

  if (!SOLO_LETRAS.test(pn)) return "El primer nombre no debe contener números.";
  if (sn && !SOLO_LETRAS.test(sn)) return "El segundo nombre no debe contener números.";
  if (!SOLO_LETRAS.test(pa)) return "El primer apellido no debe contener números.";
  if (sa && !SOLO_LETRAS.test(sa)) return "El segundo apellido no debe contener números.";

  // ✅ 2.1) Área: NO permitir "DISPONIBLE" (ahora se maneja en colección equipos)
  const area = String(contacto.area ?? "").toUpperCase().trim();
  if (area === "DISPONIBLE" || area.includes("DISPONIBLE")) {
    return 'El campo "area" no puede ser "DISPONIBLE". Ahora los disponibles se manejan en "equipos" (estado).';
  }

  // 3) Categoría 2026
  const categoria = String(contacto.categoria ?? "").trim().toLowerCase();
  if (!CATEGORIAS_PERMITIDAS.includes(categoria as CategoriaPermitida)) {
    return "Categoría inválida. Use: parlamento, diputado o senador.";
  }

  // 4) Teléfono Perú: 9 dígitos y empieza con 9
  const telNuevo = digits(contacto.telefono);
  if (!/^9\d{8}$/.test(telNuevo)) {
    return "El teléfono debe tener 9 dígitos y comenzar con 9 (Perú).";
  }

  // 5) Serie/IMEI: exactamente 15 dígitos
  const serieNuevoDig = digits(contacto.serie);
  if (!/^\d{15}$/.test(serieNuevoDig)) {
    return "El IMEI / Serie debe contener exactamente 15 dígitos numéricos.";
  }

  // 6) Fecha de atención: válida y no futura
  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);

  const fechaAtencionStr = String(contacto.fechaAtencion ?? "").trim();
  const fechaAtencion = parseFecha(fechaAtencionStr);
  if (!fechaAtencion) {
    return "La fecha de atención no es válida.";
  }

  if (fechaAtencion.getTime() > hoy.getTime()) {
    return "La fecha de atención no puede ser mayor a la fecha actual.";
  }

  // 7) Operador permitido
  const operador = String(contacto.operador ?? "").toUpperCase().trim();
  const operadoresPermitidos = ["CLARO", "MOVISTAR", "ENTEL", "BITEL"];
  if (!operadoresPermitidos.includes(operador)) {
    return "Operador inválido. Seleccione: CLARO, MOVISTAR, ENTEL o BITEL.";
  }

  // 8) Duplicados (ignorando el mismo registro en edición)
  const telDuplicado = contactos.some((c) => {
    if (modoEdicion && c.id === idEdicion) return false;
    return digits(c.telefono) === telNuevo;
  });
  if (telDuplicado) return "El número de teléfono ya está registrado.";

  const serieDuplicada = contactos.some((c) => {
    if (modoEdicion && c.id === idEdicion) return false;
    return digits(c.serie) === serieNuevoDig;
  });
  if (serieDuplicada) return "La serie/IMEI ya está registrada.";

  return null;
}
