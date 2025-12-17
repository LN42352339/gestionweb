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
  | "serie";

// ✅ Solo letras/espacios (con tildes) en mayúsculas
const SOLO_LETRAS = /^[A-ZÁÉÍÓÚÑ ]+$/;

export function validarContacto(
  contacto: Contacto,
  contactos: Contacto[],
  modoEdicion: boolean,
  idEdicion: string | null
): string | null {
  // 1) Requeridos (tipado sin any)
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
  ];

  for (const campo of camposObligatorios) {
    const valor = contacto[campo];
    if (
      valor === undefined ||
      valor === null ||
      (typeof valor === "string" && valor.trim() === "")
    ) {
      // Mensaje más amigable
      return `El campo "${campo}" es obligatorio.`;
    }
  }

  // 2) Nombres y apellidos: no números (solo letras y espacios)
  const pn = String(contacto.primerNombre ?? "").toUpperCase().trim();
  const sn = String(contacto.segundoNombre ?? "").toUpperCase().trim();
  const pa = String(contacto.primerApellido ?? "").toUpperCase().trim();
  const sa = String(contacto.segundoApellido ?? "").toUpperCase().trim();

  if (!SOLO_LETRAS.test(pn)) return "El primer nombre no debe contener números.";
  if (sn && !SOLO_LETRAS.test(sn)) return "El segundo nombre no debe contener números.";
  if (!SOLO_LETRAS.test(pa)) return "El primer apellido no debe contener números.";
  if (sa && !SOLO_LETRAS.test(sa)) return "El segundo apellido no debe contener números.";

  // 3) Teléfono Perú: 9 dígitos y empieza con 9
  const telNuevo = digits(contacto.telefono);
  if (!/^9\d{8}$/.test(telNuevo)) {
    return "El teléfono debe tener 9 dígitos y comenzar con 9 (Perú).";
  }

  // 4) Serie/IMEI: exactamente 15 dígitos
  const serieNuevoDig = digits(contacto.serie);
  if (!/^\d{15}$/.test(serieNuevoDig)) {
    return "El IMEI / Serie debe contener exactamente 15 dígitos numéricos.";
  }

  // 5) Fecha de atención: no futura
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaAtencionStr = String(contacto.fechaAtencion ?? "").trim();
  const fechaAtencion = new Date(fechaAtencionStr);
  if (isNaN(fechaAtencion.getTime())) {
    return "La fecha de atención no es válida.";
  }
  fechaAtencion.setHours(0, 0, 0, 0);

  if (fechaAtencion > hoy) {
    return "La fecha de atención no puede ser mayor a la fecha actual.";
  }

  // 6) Operador permitido
  const operador = String(contacto.operador ?? "").toUpperCase().trim();
  const operadoresPermitidos = ["CLARO", "MOVISTAR", "ENTEL", "BITEL"];
  if (!operadoresPermitidos.includes(operador)) {
    return "Operador inválido. Seleccione: CLARO, MOVISTAR, ENTEL o BITEL.";
  }

  // 7) Duplicados (ignorando el mismo registro en edición)
  const telDuplicado = contactos.some((c) => {
    if (modoEdicion && c.id === idEdicion) return false;
    return digits(c.telefono) === telNuevo;
  });
  if (telDuplicado) return "El número de teléfono ya está registrado.";

  // Si IMEI es 15 dígitos, duplicado es por dígitos (simple y exacto)
  const serieDuplicada = contactos.some((c) => {
    if (modoEdicion && c.id === idEdicion) return false;
    return digits(c.serie) === serieNuevoDig;
  });
  if (serieDuplicada) return "La serie/IMEI ya está registrada.";

  return null;
}
