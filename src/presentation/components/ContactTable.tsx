// src/components/ContactTable.tsx
import React, { useEffect, useMemo, useRef } from "react";
import ContactRow from "./ContactRow";
import { Contacto } from "../../domain/entities/contact";

/**
 * =========================
 * Props del componente tabla
 * =========================
 * - contactos: lista que se va a renderizar (ya filtrada en Dashboard)
 * - editarContacto: se ejecuta al darle "editar" a una fila
 * - eliminarContacto: se ejecuta al darle "eliminar" a una fila
 * - reactivarContacto: se ejecuta al darle "reactivar" a una fila INACTIVA
 * - contactosSeleccionados: ids marcados con checkbox
 * - toggleSeleccion: marca/desmarca un id
 *
 * Nota:
 * - toggleSeleccionTodos ya no se usa (lo podemos eliminar para evitar confusión)
 */
interface ContactTableProps {
  contactos: Contacto[];
  editarContacto: (contacto: Contacto) => void;
  eliminarContacto: (id: string | undefined) => void;
  reactivarContacto: (id: string | undefined) => void;
  contactosSeleccionados: string[];
  toggleSeleccion: (id: string) => void;

  // ⚠️ ya no se usa, se puede borrar (ver punto 3)
  toggleSeleccionTodos: () => void;
}

const ContactTable: React.FC<ContactTableProps> = ({
  contactos,
  editarContacto,
  eliminarContacto,
  reactivarContacto,
  contactosSeleccionados,
  toggleSeleccion,
}) => {
  /**
   * =========================
   * 1) IDs de contactos "activos" visibles
   * =========================
   * - Solo permitimos selección masiva en contactos ACTIVOS.
   * - Guardamos solo los ids que existan.
   */
  const idsActivosVisibles = useMemo(
    () =>
      contactos
        .filter((c) => c.estado !== "INACTIVO")
        .map((c) => c.id)
        .filter(Boolean) as string[],
    [contactos]
  );

  /**
   * =========================
   * 2) ¿Están seleccionados todos los activos visibles?
   * =========================
   * Esto controla el checkbox del encabezado.
   */
  const todosSeleccionados =
    idsActivosVisibles.length > 0 &&
    idsActivosVisibles.every((id) => contactosSeleccionados.includes(id));

  /**
   * =========================
   * 3) Checkbox "indeterminate"
   * =========================
   * Cuando está seleccionado solo "algunos" pero no todos,
   * el checkbox se muestra con el estilo "medio marcado".
   */
  const headerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!headerRef.current) return;

    const alguno = idsActivosVisibles.some((id) =>
      contactosSeleccionados.includes(id)
    );

    headerRef.current.indeterminate = alguno && !todosSeleccionados;
  }, [idsActivosVisibles, contactosSeleccionados, todosSeleccionados]);

  /**
   * =========================
   * 4) Seleccionar / deseleccionar todos (solo activos)
   * =========================
   * - Si todos los activos visibles ya estaban seleccionados → los desmarca.
   * - Si no → marca solo los que faltan.
   */
  const onToggleSeleccionTodosActivos = () => {
    if (idsActivosVisibles.length === 0) return;

    const todos = idsActivosVisibles.every((id) =>
      contactosSeleccionados.includes(id)
    );

    if (todos) {
      // Desmarcar todos los activos visibles
      idsActivosVisibles.forEach((id) => toggleSeleccion(id));
    } else {
      // Marcar solo los que faltan (activos)
      idsActivosVisibles
        .filter((id) => !contactosSeleccionados.includes(id))
        .forEach((id) => toggleSeleccion(id));
    }
  };

  /**
   * =========================
   * 5) Render de la tabla
   * =========================
   * - Encabezado fijo (sticky)
   * - Cuerpo con scroll
   * - Cada fila se renderiza con ContactRow
   */
  return (
    <div className="w-full mt-6 shadow-lg rounded-lg">
      <div className="max-h-[500px] overflow-y-auto overflow-x-auto rounded-lg">
        <table className="min-w-[1000px] w-full bg-white border border-gray-200 text-sm">
          <thead className="bg-red-500 text-white text-xs uppercase sticky top-0 z-10 shadow-md">
            <tr>
              {/* Checkbox: seleccionar todos (solo activos) */}
              <th className="px-1 py-1 border text-xs">
                <input
                  ref={headerRef}
                  type="checkbox"
                  checked={todosSeleccionados}
                  onChange={onToggleSeleccionTodosActivos}
                  title="Seleccionar todos (solo activos)"
                />
              </th>

              {/* Columnas */}
              <th className="px-1 py-1 border text-xs">Nombre completo</th>
              <th className="px-1 py-1 border text-xs">Teléfono</th>
              <th className="px-1 py-1 border text-xs">Área</th>
              <th className="px-1 py-1 border text-xs">Marca</th>
              <th className="px-1 py-1 border text-xs">Modelo</th>
              <th className="px-1 py-1 border text-xs">Serie</th>
              <th className="px-1 py-1 border text-xs">Operador</th>
              <th className="px-1 py-1 border text-xs">Fecha Atención</th>
              <th className="px-1 py-1 border text-xs">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {contactos.map((contacto, idx) => (
              <ContactRow
                key={contacto.id ?? `${contacto.telefono}-${idx}`}
                contacto={contacto}
                editarContacto={editarContacto}
                eliminarContacto={eliminarContacto}
                reactivarContacto={reactivarContacto}
                seleccionado={contactosSeleccionados.includes(contacto.id || "")}
                toggleSeleccion={toggleSeleccion}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContactTable;
