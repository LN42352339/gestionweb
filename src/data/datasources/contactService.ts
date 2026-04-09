// src/data/datasources/contactService.ts

import { Contacto } from "../../domain/entities/contact";

import { FirebaseContactRepository } from "../repositories/firebaseContactRepository";
import { GetAllContactsUseCase } from "../../domain/usecases/getAllContacts";
import { CreateContactUseCase } from "../../domain/usecases/createContact";
import { UpdateContactUseCase } from "../../domain/usecases/updateContact";

import { agregarAHistorial } from "./historialService";

import { db } from "../../config/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

// Repositorio
const contactRepository = new FirebaseContactRepository();

// Casos de uso
const getAllContactsUseCase = new GetAllContactsUseCase(contactRepository);
const createContactUseCase = new CreateContactUseCase(contactRepository);
const updateContactUseCase = new UpdateContactUseCase(contactRepository);

/* ============================================================
   ✅ 1) CONFIG: URL del Webhook de n8n
   ============================================================ */

// ✅ PRUEBAS
const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/contacto-evento";

/* ============================================================
   ✅ 2) Helper: enviar evento a n8n (SIN romper el sistema)
   - contacto es OPCIONAL (para IMPORTACION_RESUMEN)
   ============================================================ */

type TipoMovimiento =
  | "ALTA_MANUAL"
  | "ASIGNACION"
  | "BAJA_PERSONA"
  | "REACTIVACION"
  | "ACTUALIZACION"
  | "IMPORTACION_RESUMEN";

async function notificarN8N(payload: {
  tipoMovimiento: TipoMovimiento;
  contacto?: Contacto; // ✅ opcional
  observacion?: string;
}) {
  try {
    if (import.meta.env.DEV) {
      console.log("📨 Enviando a n8n:", payload.tipoMovimiento, payload);
    }

    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (import.meta.env.DEV) {
      console.log("✅ n8n respondió:", res.status);
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("⚠️ No se pudo notificar a n8n:", err);
    }
    // Importante: NO lanzamos error para no romper el flujo principal
  }
}

export async function obtenerContactos(): Promise<Contacto[]> {
  return getAllContactsUseCase.execute();
}

export async function agregarContacto(
  contacto: Contacto,
  opts?: { notificar?: boolean; origen?: "MANUAL" | "IMPORTACION" }
): Promise<string> {
  const id = await createContactUseCase.execute(contacto);

  const notificar = opts?.notificar ?? true;
  const origen = opts?.origen ?? "MANUAL";

  if (notificar) {
    await notificarN8N({
      tipoMovimiento: "ALTA_MANUAL",
      contacto: { ...contacto, id },
      observacion:
        origen === "IMPORTACION"
          ? "Alta por importación desde la web"
          : "Alta manual desde la web",
    });
  }

  return id;
}

function esDisponible(c: Contacto): boolean {
  return c.estado === "INACTIVO";
}

function diffCampos(before: Contacto, after: Contacto): string[] {
  const cambios: string[] = [];

  const cmp = (label: string, a: unknown, b: unknown) => {
    const va = String(a ?? "").trim();
    const vb = String(b ?? "").trim();
    if (va !== vb) cambios.push(label);
  };

  cmp("nombreCompleto", before.nombreCompleto, after.nombreCompleto);
  cmp("primerNombre", before.primerNombre, after.primerNombre);
  cmp("segundoNombre", before.segundoNombre, after.segundoNombre);
  cmp("primerApellido", before.primerApellido, after.primerApellido);
  cmp("segundoApellido", before.segundoApellido, after.segundoApellido);

  cmp("area", before.area, after.area);
  cmp("operador", before.operador, after.operador);
  cmp("fechaAtencion", before.fechaAtencion, after.fechaAtencion);

  cmp("telefono", before.telefono, after.telefono);
  cmp("marca", before.marca, after.marca);
  cmp("modelo", before.modelo, after.modelo);
  cmp("serie", before.serie, after.serie);

  cmp("categoria", before.categoria, after.categoria);
  cmp("estado", before.estado, after.estado);

  return cambios;
}

export async function actualizarContacto(
  id: string,
  contacto: Contacto
): Promise<void> {
  const original = await contactRepository.getById(id);

  if (!original) {
    await updateContactUseCase.execute(id, contacto);

    await notificarN8N({
      tipoMovimiento: "ACTUALIZACION",
      contacto: { ...contacto, id },
      observacion: "Actualización manual (sin original)",
    });

    return;
  }

  const originalEraDisponible = esDisponible(original);

  const contactoFinal: Contacto = {
    ...contacto,
    id,
    estado: originalEraDisponible ? "ACTIVO" : contacto.estado ?? original.estado,
  };

  const cambios = diffCampos(original, contactoFinal);

  if (cambios.length === 0) {
    await updateContactUseCase.execute(id, contactoFinal);
    return;
  }

  if (originalEraDisponible) {
    await agregarAHistorial(
      contactoFinal,
      "ASIGNACION",
      "Asignación de plaza disponible"
    );

    await notificarN8N({
      tipoMovimiento: "ASIGNACION",
      contacto: contactoFinal,
      observacion: "Asignación de plaza disponible (manual web)",
    });
  } else {
    await agregarAHistorial(
      contactoFinal,
      "ACTUALIZACION",
      `Cambios: ${cambios.join(", ")}`
    );

    await notificarN8N({
      tipoMovimiento: "ACTUALIZACION",
      contacto: contactoFinal,
      observacion: `Cambios: ${cambios.join(", ")}`,
    });
  }

  await updateContactUseCase.execute(id, contactoFinal);
}

/**
 * 🗑️ ELIMINAR = BAJA_PERSONA
 */
export async function eliminarContacto(
  id: string,
  observacion?: string
): Promise<void> {
  const contacto = await contactRepository.getById(id);
  if (!contacto) throw new Error("Contacto no encontrado");

  await agregarAHistorial(
    contacto,
    "BAJA_PERSONA",
    observacion ?? "Baja de persona, plaza liberada"
  );

  await notificarN8N({
    tipoMovimiento: "BAJA_PERSONA",
    contacto: { ...contacto, id },
    observacion: observacion ?? "Baja manual desde la web (plaza liberada)",
  });

  const fechaEliminacion = new Date().toLocaleDateString("es-PE");

  await updateDoc(doc(db, "contactos", id), {
    estado: "INACTIVO",
    nombreCompleto: "DISPONIBLE",
    primerNombre: "DISPONIBLE",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    area: "PENDIENTE",
    operador: "",
    fechaAtencion: fechaEliminacion,
  });
}

/**
 * ♻️ REACTIVAR
 */
export async function reactivarContacto(id: string): Promise<void> {
  const contacto = await contactRepository.getById(id);
  if (!contacto) return;

  await agregarAHistorial(
    { ...contacto, estado: "ACTIVO" },
    "REACTIVACION",
    "Reactivación de contacto"
  );

  await notificarN8N({
    tipoMovimiento: "REACTIVACION",
    contacto: { ...contacto, id, estado: "ACTIVO" },
    observacion: "Reactivación manual desde la web",
  });

  await updateDoc(doc(db, "contactos", id), { estado: "ACTIVO" });
}

/**
 * ✅ Enviar 1 solo evento al finalizar la importación
 * - No requiere "contacto" real
 * - observacion lleva el JSON (resumen+detalle)
 */
export async function notificarImportacionResumen(payload: {
  resumen: {
    total: number;
    insertados: number;
    rechazados: number;
    dupTelefono: number;
    dupSerie: number;
    invalidos: number;
    categoriaInvalida: number;
    fechaFutura: number;
  };
  detalle: {
    duplicadosTelefono: string[];
    duplicadosSerie: string[];
    invalidos: { fila: number; motivo: string; telefono?: string; serie?: string }[];
    categoriaInvalida: { fila: number; valor: string }[];
    fechaFutura: { fila: number; fecha: string; telefono?: string; serie?: string }[];
  };
}): Promise<void> {
  await notificarN8N({
    tipoMovimiento: "IMPORTACION_RESUMEN",
    observacion: JSON.stringify(payload),
  });
}
