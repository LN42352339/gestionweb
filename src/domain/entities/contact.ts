// src/domain/entities/contact.ts

export type Categoria = "parlamento" | "diputado" | "senador" | "congresal";
export type EstadoContacto = "ACTIVO" | "INACTIVO";

// ✅ Tipos de movimiento para auditoría
export type TipoMovimientoHistorial =
  | "BAJA_PERSONA"
  | "REACTIVACION"
  | "ASIGNACION"
  | "ACTUALIZACION";

export interface Contacto {
  id?: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  area: string;
  fechaAtencion: string;
  operador: string;
  telefono: string;
  marca: string;
  modelo: string;
  serie: string;
  nombreCompleto: string;
  categoria: Categoria;
  estado?: EstadoContacto;
  createdAt?: string;
}

// ✅ Historial: copia del contacto + metadata del movimiento
export interface ContactoConHistorial extends Omit<Contacto, "id"> {
  id?: string;
  eliminadoEn: string;

  // ✅ Para enlazar con el doc original
  contactoIdOriginal?: string;

  // ✅ Auditoría fina
  tipoMovimiento: TipoMovimientoHistorial;
  observacion?: string;
}
