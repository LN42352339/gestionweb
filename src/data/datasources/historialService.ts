// src/data/datasources/historialService.ts
// Puente entre presentación y dominio para el historial

import {
  Contacto,
  ContactoConHistorial,
  TipoMovimientoHistorial,
  EstadoContacto,
} from "../../domain/entities/contact";

import { FirebaseHistorialRepository } from "../repositories/firebaseHistorialRepository";
import { GetAllHistorialUseCase } from "../../domain/usecases/getAllHistorial";
import { CreateHistorialUseCase } from "../../domain/usecases/createHistorial";

// Repositorio concreto
const historialRepository = new FirebaseHistorialRepository();

// Casos de uso
const getAllHistorialUseCase = new GetAllHistorialUseCase(historialRepository);
const createHistorialUseCase = new CreateHistorialUseCase(historialRepository);

/**
 * ✅ Agregar al historial con tipo de movimiento (auditoría)
 * Regla:
 * - NO registramos "ALTA" (creación)
 * - Registramos: BAJA_PERSONA, ASIGNACION, ACTUALIZACION, REACTIVACION
 */
export async function agregarAHistorial(
  contacto: Contacto,
  tipoMovimiento: TipoMovimientoHistorial,
  observacion?: string
): Promise<string> {
  const { id, ...resto } = contacto;

  const estadoActual: EstadoContacto = contacto.estado ?? "ACTIVO";

  // ✅ Reglas de estado por movimiento
  const estadoFinal: EstadoContacto =
    tipoMovimiento === "BAJA_PERSONA"
      ? "INACTIVO"
      : tipoMovimiento === "REACTIVACION"
      ? "ACTIVO"
      : tipoMovimiento === "ASIGNACION"
      ? "ACTIVO"
      : estadoActual; // ACTUALIZACION mantiene

  const ahoraISO = new Date().toISOString();

  const registro: ContactoConHistorial = {
    ...resto,

    contactoIdOriginal: String(id ?? ""),
    // movimiento timestamp
    eliminadoEn: ahoraISO,
    // ✅ importante para ordenar y mostrar “último cambio”
    createdAt: ahoraISO,

    tipoMovimiento,
    estado: estadoFinal,

    observacion: observacion?.trim() ? observacion.trim() : undefined,
  };

  return createHistorialUseCase.execute(registro);
}

export async function obtenerHistorial(): Promise<ContactoConHistorial[]> {
  return getAllHistorialUseCase.execute();
}
