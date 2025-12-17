// src/domain/repositories/contactRepository.ts
import { Contacto } from "../entities/contact";

export interface ContactRepository {
  // 🔥 Ahora permite un filtro opcional por categoría
  getAll(categoria?: string): Promise<Contacto[]>;

  create(contacto: Contacto): Promise<string>;
  update(id: string, contacto: Contacto): Promise<void>;
  delete(id: string): Promise<void>;

  // Opcional, porque no todos los repositorios necesitan implementarlo
  deleteBatch?(ids: string[]): Promise<void>;
}


