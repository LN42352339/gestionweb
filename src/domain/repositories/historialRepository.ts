// src/domain/repositories/historialRepository.ts
import { ContactoConHistorial } from "../entities/contact";

export interface HistorialRepository {
  getAll(): Promise<ContactoConHistorial[]>;
  create(contacto: ContactoConHistorial): Promise<string>;
}
