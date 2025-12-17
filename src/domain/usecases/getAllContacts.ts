import { ContactRepository } from "../repositories/contactRepository";
import { Contacto } from "../entities/contact";

/**
 * Caso de uso para obtener contactos.
 * 🔥 Ahora permite filtros opcionales por categoría:
 *    - execute() → trae todos
 *    - execute("parlamento") → solo parlamentarios
 *    - execute("congresal") → solo congresales
 */
export class GetAllContactsUseCase {
  private readonly repository: ContactRepository;

  constructor(repository: ContactRepository) {
    this.repository = repository;
  }

  async execute(categoria?: string): Promise<Contacto[]> {
    return this.repository.getAll(categoria);
  }
}



