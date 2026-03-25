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
  getDoc,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

import { Contacto, Categoria, EstadoContacto } from "../../domain/entities/contact";
import { ContactRepository } from "../../domain/repositories/contactRepository";

/* =========================
   Helpers seguros
   ========================= */
function normalizarCategoria(raw: unknown): Categoria {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "parlamento" || v === "diputado" || v === "senador" || v === "congresal") {
    return v as Categoria;
  }
  return "parlamento";
}

function normalizarEstado(raw: unknown): EstadoContacto {
  const v = String(raw ?? "").trim().toUpperCase();
  return v === "INACTIVO" ? "INACTIVO" : "ACTIVO";
}

function toStringSeguro(raw: unknown): string {
  return String(raw ?? "");
}

function toISOorEmpty(raw: unknown): string | undefined {
  const s = String(raw ?? "").trim();
  return s ? s : undefined;
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

/* =========================
   Repository
   ========================= */
export class FirebaseContactRepository implements ContactRepository {
  private collectionRef = collection(db, "contactos");

  async getById(id: string): Promise<Contacto | null> {
    const ref = doc(this.collectionRef, id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = asRecord(snap.data());

    return {
      id: snap.id,
      primerNombre: toStringSeguro(data["primerNombre"]),
      segundoNombre: toStringSeguro(data["segundoNombre"]),
      primerApellido: toStringSeguro(data["primerApellido"]),
      segundoApellido: toStringSeguro(data["segundoApellido"]),
      area: toStringSeguro(data["area"]),
      fechaAtencion: toStringSeguro(data["fechaAtencion"]),
      operador: toStringSeguro(data["operador"]),
      telefono: toStringSeguro(data["telefono"]),
      marca: toStringSeguro(data["marca"]),
      modelo: toStringSeguro(data["modelo"]),
      serie: toStringSeguro(data["serie"]),
      nombreCompleto: toStringSeguro(data["nombreCompleto"]),
      categoria: normalizarCategoria(data["categoria"]),
      estado: normalizarEstado(data["estado"]),
      createdAt: toISOorEmpty(data["createdAt"]),
    };
  }

  async getAll(categoria?: string): Promise<Contacto[]> {
    const constraints: QueryConstraint[] = [];
    if (categoria) constraints.push(where("categoria", "==", categoria));

    const q = constraints.length ? query(this.collectionRef, ...constraints) : this.collectionRef;
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = asRecord(d.data());

      return {
        id: d.id,
        primerNombre: toStringSeguro(data["primerNombre"]),
        segundoNombre: toStringSeguro(data["segundoNombre"]),
        primerApellido: toStringSeguro(data["primerApellido"]),
        segundoApellido: toStringSeguro(data["segundoApellido"]),
        area: toStringSeguro(data["area"]),
        fechaAtencion: toStringSeguro(data["fechaAtencion"]),
        operador: toStringSeguro(data["operador"]),
        telefono: toStringSeguro(data["telefono"]),
        marca: toStringSeguro(data["marca"]),
        modelo: toStringSeguro(data["modelo"]),
        serie: toStringSeguro(data["serie"]),
        nombreCompleto: toStringSeguro(data["nombreCompleto"]),
        categoria: normalizarCategoria(data["categoria"]),
        estado: normalizarEstado(data["estado"]),
        createdAt: toISOorEmpty(data["createdAt"]),
      };
    });
  }

  async create(contacto: Contacto): Promise<string> {
    const payload: Omit<Contacto, "id"> = {
      primerNombre: toStringSeguro(contacto.primerNombre),
      segundoNombre: toStringSeguro(contacto.segundoNombre),
      primerApellido: toStringSeguro(contacto.primerApellido),
      segundoApellido: toStringSeguro(contacto.segundoApellido),
      area: toStringSeguro(contacto.area),
      fechaAtencion: toStringSeguro(contacto.fechaAtencion),
      operador: toStringSeguro(contacto.operador),
      telefono: toStringSeguro(contacto.telefono),
      marca: toStringSeguro(contacto.marca),
      modelo: toStringSeguro(contacto.modelo),
      serie: toStringSeguro(contacto.serie),
      nombreCompleto: toStringSeguro(contacto.nombreCompleto),
      createdAt: toISOorEmpty(contacto.createdAt),
      categoria: normalizarCategoria(contacto.categoria),
      estado: normalizarEstado(contacto.estado),
    };

    const result = await addDoc(this.collectionRef, payload);
    return result.id;
  }

  async update(id: string, contacto: Contacto): Promise<void> {
    const ref = doc(this.collectionRef, id);

    const payload: Partial<Contacto> = {
      primerNombre: toStringSeguro(contacto.primerNombre),
      segundoNombre: toStringSeguro(contacto.segundoNombre),
      primerApellido: toStringSeguro(contacto.primerApellido),
      segundoApellido: toStringSeguro(contacto.segundoApellido),
      area: toStringSeguro(contacto.area),
      fechaAtencion: toStringSeguro(contacto.fechaAtencion),
      operador: toStringSeguro(contacto.operador),
      telefono: toStringSeguro(contacto.telefono),
      marca: toStringSeguro(contacto.marca),
      modelo: toStringSeguro(contacto.modelo),
      serie: toStringSeguro(contacto.serie),
      nombreCompleto: toStringSeguro(contacto.nombreCompleto),
      createdAt: toISOorEmpty(contacto.createdAt),
      categoria: normalizarCategoria(contacto.categoria),
      estado: normalizarEstado(contacto.estado),
    };

    await updateDoc(ref, payload);
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.collectionRef, id));
  }

  async deleteBatch(ids: string[]): Promise<void> {
    const batch = writeBatch(db);
    ids.forEach((id) => batch.delete(doc(this.collectionRef, id)));
    await batch.commit();
  }
}
