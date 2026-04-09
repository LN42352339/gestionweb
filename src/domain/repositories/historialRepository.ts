// src/domain/repositories/historialRepository.ts
import { ContactoConHistorial, TipoMovimientoHistorial } from "../entities/contact";

export interface HistorialRepository {
  getAll(): Promise<ContactoConHistorial[]>;
  create(contacto: ContactoConHistorial): Promise<string>;
  countByMovement(tipoMovimiento: TipoMovimientoHistorial): Promise<number>;
}
