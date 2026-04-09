// src/domain/usecases/countHistorialByMovement.ts
import { HistorialRepository } from "../repositories/historialRepository";
import { TipoMovimientoHistorial } from "../entities/contact";

export class CountHistorialByMovementUseCase {
  constructor(private repository: HistorialRepository) {}

  async execute(tipoMovimiento: TipoMovimientoHistorial): Promise<number> {
    return this.repository.countByMovement(tipoMovimiento);
  }
}
