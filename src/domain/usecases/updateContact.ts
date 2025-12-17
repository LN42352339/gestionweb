import { ContactRepository } from "../repositories/contactRepository";
import { Contacto } from "../entities/contact";

export class UpdateContactUseCase {
  constructor(private repository: ContactRepository) {}

  async execute(id: string, contacto: Contacto): Promise<void> {
    return this.repository.update(id, contacto);
  }
}
