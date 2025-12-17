// src/data/repositories/firebaseHistorialRepository.ts
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

import { ContactoConHistorial } from "../../domain/entities/contact";
import { HistorialRepository } from "../../domain/repositories/historialRepository";

export class FirebaseHistorialRepository implements HistorialRepository {
  private collectionRef = collection(db, "historialContactos");

  async getAll(): Promise<ContactoConHistorial[]> {
    const snapshot = await getDocs(this.collectionRef);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ContactoConHistorial, "id">),
    }));
  }

  async create(contacto: ContactoConHistorial): Promise<string> {
    // No mandamos el id a Firestore
    const { id, ...dataSinId } = contacto;
    const result = await addDoc(this.collectionRef, dataSinId);
    return result.id;
  }
}
