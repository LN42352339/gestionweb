import { ContactRepository } from "../repositories/contactRepository";

export class DeleteContactUseCase {
  constructor(private repository: ContactRepository) {}

  async execute(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
