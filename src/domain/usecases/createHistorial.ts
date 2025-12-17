// src/domain/usecases/createHistorial.ts
import { HistorialRepository } from "../repositories/historialRepository";
import { ContactoConHistorial } from "../entities/contact";

export class CreateHistorialUseCase {
  constructor(private readonly repository: HistorialRepository) {}

  async execute(contacto: ContactoConHistorial): Promise<string> {
    return this.repository.create(contacto);
  }
}
