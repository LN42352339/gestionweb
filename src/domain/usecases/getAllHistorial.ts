// src/domain/usecases/getAllHistorial.ts
import { HistorialRepository } from "../repositories/historialRepository";
import { ContactoConHistorial } from "../entities/contact";

export class GetAllHistorialUseCase {
  constructor(private readonly repository: HistorialRepository) {}

  async execute(): Promise<ContactoConHistorial[]> {
    return this.repository.getAll();
  }
}
