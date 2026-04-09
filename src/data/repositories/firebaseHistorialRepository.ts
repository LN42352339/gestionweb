// src/data/repositories/firebaseHistorialRepository.ts
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

import {
  ContactoConHistorial,
  Categoria,
  EstadoContacto,
  TipoMovimientoHistorial,
} from "../../domain/entities/contact";
import { HistorialRepository } from "../../domain/repositories/historialRepository";

/* =========================
   Helpers seguros (sin any)
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

function normalizarMovimiento(raw: unknown): TipoMovimientoHistorial {
  const v = String(raw ?? "").trim().toUpperCase();
  if (
    v === "BAJA_PERSONA" ||
    v === "REACTIVACION" ||
    v === "ASIGNACION" ||
    v === "ACTUALIZACION"
  ) {
    return v as TipoMovimientoHistorial;
  }
  return "BAJA_PERSONA";
}

function toStringSeguro(raw: unknown): string {
  return String(raw ?? "");
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

export class FirebaseHistorialRepository implements HistorialRepository {
  private collectionRef = collection(db, "historialContactos");

  async getAll(): Promise<ContactoConHistorial[]> {
    const q = query(this.collectionRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = asRecord(d.data());

      return {
        id: d.id,
        contactoIdOriginal: toStringSeguro(data["contactoIdOriginal"]),
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
        createdAt: toStringSeguro(data["createdAt"]),
        eliminadoEn: toStringSeguro(data["eliminadoEn"]),
        tipoMovimiento: normalizarMovimiento(data["tipoMovimiento"]),
        observacion: toStringSeguro(data["observacion"]) || undefined,
      };
    });
  }

  async countByMovement(tipoMovimiento: TipoMovimientoHistorial): Promise<number> {
    const q = query(
      this.collectionRef,
      where("tipoMovimiento", "==", tipoMovimiento)
    );
    const snap = await getCountFromServer(q);
    return snap.data().count;
  }

  async create(contacto: ContactoConHistorial): Promise<string> {
    const payload: Omit<ContactoConHistorial, "id"> = {
      contactoIdOriginal: toStringSeguro(contacto.contactoIdOriginal),
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
      categoria: normalizarCategoria(contacto.categoria),
      estado: normalizarEstado(contacto.estado),
      createdAt: toStringSeguro(contacto.createdAt),
      eliminadoEn: toStringSeguro(contacto.eliminadoEn),
      tipoMovimiento: normalizarMovimiento(contacto.tipoMovimiento),
      observacion: toStringSeguro(contacto.observacion) || undefined,
    };

    const result = await addDoc(this.collectionRef, payload);
    return result.id;
  }
}
