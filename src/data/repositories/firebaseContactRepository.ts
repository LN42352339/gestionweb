// src/data/repositories/firebaseContactRepository.ts
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

import { Contacto } from "../../domain/entities/contact";
import { ContactRepository } from "../../domain/repositories/contactRepository";

export class FirebaseContactRepository implements ContactRepository {
  private collectionRef = collection(db, "contactos");

  /**
   * 🔥 Ahora soporta filtro opcional por categoría:
   *  - getAll() → trae todos los contactos
   *  - getAll("parlamento") → solo parlamentarios
   *  - getAll("congresal") → solo congresales
   */
  async getAll(categoria?: string): Promise<Contacto[]> {
    let snapshot;

    if (categoria) {
      const q = query(this.collectionRef, where("categoria", "==", categoria));
      snapshot = await getDocs(q);
    } else {
      snapshot = await getDocs(this.collectionRef);
    }

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Contacto, "id">),
    }));
  }

  async create(contacto: Contacto): Promise<string> {
    const { id: _, ...contactoSinId } = contacto;
    const result = await addDoc(this.collectionRef, contactoSinId);
    return result.id;
  }

  async update(id: string, contacto: Contacto): Promise<void> {
    const ref = doc(this.collectionRef, id);

    // Firestore no acepta el campo "id" dentro del documento
    const { id: _, ...contactoSinId } = contacto;

    await updateDoc(ref, contactoSinId);
  }

  async delete(id: string): Promise<void> {
    const ref = doc(this.collectionRef, id);
    await deleteDoc(ref);
  }

  async deleteBatch(ids: string[]): Promise<void> {
    const batch = writeBatch(db);

    ids.forEach((id) => {
      const ref = doc(this.collectionRef, id);
      batch.delete(ref);
    });

    await batch.commit();
  }
}
