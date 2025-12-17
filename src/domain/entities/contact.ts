// Interfaz principal del contacto
export interface Contacto {
  id?: string; // Se genera automáticamente por Firestore
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  area: string;
  fechaAtencion: string; // formato string "YYYY-MM-DD" o "DD/MM/YYYY"
  operador: string;
  telefono: string;
  marca: string;
  modelo: string;
  serie: string;
  nombreCompleto?: string; // generado automáticamente si no se provee
  createdAt?: string; // ← NUEVO (ISO string o DD/MM/YYYY)
  categoria: "parlamento" | "congresal";
}

// Interfaz extendida para contactos eliminados con historial
export interface ContactoConHistorial extends Contacto {
  eliminadoEn: string; // fecha de eliminación
}
