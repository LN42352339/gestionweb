// src/data/datasources/contactService.ts
// 👉 Puente entre la capa de presentación y los casos de uso

import { Contacto } from "../../domain/entities/contact";
import { FirebaseContactRepository } from "../repositories/firebaseContactRepository";

import { GetAllContactsUseCase } from "../../domain/usecases/getAllContacts";
import { CreateContactUseCase } from "../../domain/usecases/createContact";
import { UpdateContactUseCase } from "../../domain/usecases/updateContact";
import { DeleteContactUseCase } from "../../domain/usecases/deleteContact";

// ✅ Repositorio concreto
const contactRepository = new FirebaseContactRepository();

// ✅ Casos de uso
const getAllContactsUseCase = new GetAllContactsUseCase(contactRepository);
const createContactUseCase = new CreateContactUseCase(contactRepository);
const updateContactUseCase = new UpdateContactUseCase(contactRepository);
const deleteContactUseCase = new DeleteContactUseCase(contactRepository);

// 🔥 Necesarios para migración temporal
import { db } from "../../config/firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";



// ---------------------------------------------------------
// 🔹 Funciones que usa tu Dashboard / History / Statistics
// ---------------------------------------------------------

export async function obtenerContactos(categoria?: string): Promise<Contacto[]> {
  return getAllContactsUseCase.execute(categoria);
}


export async function agregarContacto(contacto: Contacto): Promise<string> {
  return createContactUseCase.execute(contacto);
}

export async function actualizarContacto(
  id: string,
  contacto: Contacto
): Promise<void> {
  return updateContactUseCase.execute(id, contacto);
}

export async function eliminarContacto(id: string): Promise<void> {
  return deleteContactUseCase.execute(id);
}

/**
 * 🗑️ Eliminación múltiple con progreso
 */
export async function eliminarContactosBatchConProgreso(
  ids: string[],
  onProgress: (done: number, total: number) => void
): Promise<void> {
  const total = ids.length;
  let done = 0;

  for (const id of ids) {
    await deleteContactUseCase.execute(id);
    done++;
    onProgress(done, total);
  }
}

// ========================================================================
// 🚨 Funciones de migración Firestore (solo para desarrollo - no en producción)
// ========================================================================

/**
 * 1️⃣ Agregar categoria="parlamento" a documentos existentes en `contactos`
 *    (solo a los que no tengan categoria todavía)
 */
export const setCategoriaParlamentoEnContactos = async () => {
  const contactosRef = collection(db, "contactos");
  const snapshot = await getDocs(contactosRef);

  let actualizados = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    if (!data.categoria) {
      await updateDoc(doc(db, "contactos", docSnap.id), {
        categoria: "parlamento",
      });
      actualizados++;
    }
  }

  console.log(`✅ ${actualizados} documentos actualizados con categoria='parlamento'`);
};


/**
 * 2️⃣ Migrar documentos desde `congresales` → `contactos`
 *    manteniendo o asignando categoria="congresal"
 */
export const migrarCongresalesAContactos = async () => {
  const congresalesRef = collection(db, "congresales");
  const snapshot = await getDocs(congresalesRef);

  let migrados = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    const contactoRef = doc(db, "contactos", docSnap.id);

    await setDoc(contactoRef, {
      ...data,
      categoria: data.categoria || "congresal", // asegura categoría
    }, { merge: true });

    migrados++;
  }

  console.log(`🚀 Migrados ${migrados} congresales a 'contactos' exitosamente`);
};

