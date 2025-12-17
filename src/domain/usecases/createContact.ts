import { ContactRepository } from "../repositories/contactRepository";
import { Contacto } from "../entities/contact";

export class CreateContactUseCase {
  constructor(private repository: ContactRepository) {}

  async execute(contacto: Contacto): Promise<string> {
    return this.repository.create(contacto);
  }
}
