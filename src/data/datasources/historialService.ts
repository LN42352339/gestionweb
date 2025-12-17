// src/data/datasources/historialService.ts
// Puente entre presentación y dominio para el historial

import { Contacto, ContactoConHistorial } from "../../domain/entities/contact";
import { FirebaseHistorialRepository } from "../repositories/firebaseHistorialRepository";
import { GetAllHistorialUseCase } from "../../domain/usecases/getAllHistorial";
import { CreateHistorialUseCase } from "../../domain/usecases/createHistorial";

// Repositorio concreto
const historialRepository = new FirebaseHistorialRepository();

// Casos de uso
const getAllHistorialUseCase = new GetAllHistorialUseCase(historialRepository);
const createHistorialUseCase = new CreateHistorialUseCase(historialRepository);

/**
 *  Se usa en Dashboard al eliminar un contacto
 *  Recibe un Contacto normal, le agrega eliminadoEn y lo guarda en historial.
 */
export async function agregarAHistorial(
  contacto: Contacto
): Promise<string> {
  const { id, ...resto } = contacto;

  const registro: ContactoConHistorial = {
    ...resto,
    eliminadoEn: new Date().toISOString(), // o formato que prefieras
  };

  return createHistorialUseCase.execute(registro);
}

/**
 * 🔹 Se usará en la pantalla History para listar los contactos eliminados.
 */
export async function obtenerHistorial(): Promise<ContactoConHistorial[]> {
  console.log("🔥 Cargando historial desde el Use Case...");

  return getAllHistorialUseCase.execute();
}
