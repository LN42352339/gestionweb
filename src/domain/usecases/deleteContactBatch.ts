import { ContactRepository } from "../repositories/contactRepository";

export class DeleteContactBatchUseCase {
  constructor(private repository: ContactRepository) {}

  async execute(ids: string[]): Promise<void> {
    if (!this.repository.deleteBatch) {
      throw new Error("El repositorio no soporta eliminación por lote");
    }
    return this.repository.deleteBatch(ids);
  }
}
