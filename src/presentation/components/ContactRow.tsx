// src/components/ContactRow.tsx
import React from "react";
import { FaRegEdit, FaTrash, FaUndoAlt } from "react-icons/fa";
import { Contacto } from "../../domain/entities/contact";

/**
 * =========================
 * Props de una fila (ContactRow)
 * =========================
 * - contacto: información de la fila
 * - editarContacto: acción para editar
 * - eliminarContacto: acción para "eliminar" (en tu caso = desactivar / mandar a historial)
 * - reactivarContacto: acción para reactivar un contacto inactivo
 * - seleccionado: si el checkbox está marcado
 * - toggleSeleccion: marca/desmarca el checkbox del contacto
 */
interface ContactRowProps {
  contacto: Contacto;

  editarContacto: (contacto: Contacto) => void;
  eliminarContacto: (id: string | undefined) => void;
  reactivarContacto: (id: string | undefined) => void;

  seleccionado: boolean;
  toggleSeleccion: (id: string) => void;
}

const ContactRow: React.FC<ContactRowProps> = ({
  contacto,
  editarContacto,
  eliminarContacto,
  reactivarContacto,
  seleccionado,
  toggleSeleccion,
}) => {
  /**
   * =========================
   * 1) Variables de ayuda
   * =========================
   * - id: id del documento en Firestore
   * - inactivo: si el contacto está INACTIVO (DISPONIBLE)
   */
  const id = contacto.id;
  const inactivo = contacto.estado === "INACTIVO";

  /**
   * =========================
   * 2) Estilos según estado
   * =========================
   * Si está inactivo, lo vemos "apagado" (opacidad) para diferenciarlo.
   */
  const rowClassName = inactivo
    ? "opacity-60 bg-gray-50"
    : "hover:bg-gray-50";

  /**
   * =========================
   * 3) Checkbox
   * =========================
   * Reglas:
   * - Si no hay id, no se puede seleccionar (no existe en BD)
   * - Si está INACTIVO, tampoco se puede seleccionar
   */
  const checkboxDisabled = !id || inactivo;

  /**
   * =========================
   * 4) Render
   * =========================
   * Mostramos columnas y acciones:
   * - Editar: permitido incluso si está INACTIVO (por si quieres corregir datos antes de reactivar)
   * - Eliminar: solo si está ACTIVO
   * - Reactivar: solo si está INACTIVO
   */
  return (
    <tr className={`${rowClassName} transition`}>
      {/* ✅ Columna: selección (solo activos) */}
      <td className="px-1 py-1 border text-center">
        <input
          type="checkbox"
          disabled={checkboxDisabled}
          checked={!!id && seleccionado && !inactivo}
          onChange={() => {
            if (!id || inactivo) return;
            toggleSeleccion(id);
          }}
          title={
            inactivo
              ? "No se puede seleccionar un contacto inactivo"
              : "Seleccionar contacto"
          }
        />
      </td>

      {/* ✅ Datos */}
      <td className="px-1 py-1 border text-xs">{contacto.nombreCompleto || "-"}</td>
      <td className="px-1 py-1 border text-xs">{contacto.telefono || "-"}</td>
      <td className="px-1 py-1 border text-xs">{contacto.area || "-"}</td>
      <td className="px-1 py-1 border text-xs">{contacto.marca || "-"}</td>
      <td className="px-1 py-1 border text-xs">{contacto.modelo || "-"}</td>
      <td className="px-1 py-1 border text-xs">{contacto.serie || "-"}</td>
      <td className="px-1 py-1 border text-xs">{contacto.operador || "-"}</td>
      <td className="px-1 py-1 border text-xs">{contacto.fechaAtencion || "-"}</td>

      {/* ✅ Acciones */}
      <td className="px-1 py-1 border">
        <div className="flex items-center justify-center gap-2">
          {/* ✏️ Editar (siempre permitido) */}
          <button
            type="button"
            onClick={() => editarContacto(contacto)}
            className="p-2 rounded-full bg-slate-600 text-white hover:bg-slate-700 transition"
            title="Editar"
          >
            <FaRegEdit size={14} />
          </button>

          {/* 🗑️ Si está ACTIVO -> Eliminar (desactivar) */}
          {!inactivo ? (
            <button
              type="button"
              onClick={() => eliminarContacto(id)}
              className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
              title="Eliminar (desactivar / guardar en historial)"
            >
              <FaTrash size={14} />
            </button>
          ) : (
            /* ♻️ Si está INACTIVO -> Reactivar */
            <button
              type="button"
              onClick={() => reactivarContacto(id)}
              className="p-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition"
              title="Reactivar"
            >
              <FaUndoAlt size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default ContactRow;
