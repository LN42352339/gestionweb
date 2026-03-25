// src/domain/repositories/contactRepository.ts
import { Contacto } from "../entities/contact";

export interface ContactRepository {
  // ✅ Filtro opcional por categoría
  getAll(categoria?: string): Promise<Contacto[]>;

  // ✅ (Recomendado) Para cuando un UseCase o pantalla necesite un solo contacto
  getById?(id: string): Promise<Contacto | null>;

  create(contacto: Contacto): Promise<string>;
  update(id: string, contacto: Contacto): Promise<void>;
  delete(id: string): Promise<void>;

  // ✅ Opcional
  deleteBatch?(ids: string[]): Promise<void>;
}

