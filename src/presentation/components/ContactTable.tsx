// src/components/ContactTable.tsx
import React, { useEffect, useRef } from "react";
import ContactRow from "./ContactRow";
import { Contacto } from "../../domain/entities/contact";
interface ContactTableProps {
  contactos: Contacto[];
  editarContacto: (contacto: Contacto) => void;
  eliminarContacto: (id: string | undefined) => void;
  contactosSeleccionados: string[];
  toggleSeleccion: (id: string) => void;
  toggleSeleccionTodos: () => void;
}

const ContactTable: React.FC<ContactTableProps> = ({
  contactos,
  editarContacto,
  eliminarContacto,
  contactosSeleccionados,
  toggleSeleccion,
  toggleSeleccionTodos,
}) => {
  // ✅ (2) ids visibles robustos y cálculo de "todos seleccionados"
  const idsVisibles = contactos.map((c) => c.id).filter(Boolean) as string[];
  const todosSeleccionados =
    idsVisibles.length > 0 &&
    idsVisibles.every((id) => contactosSeleccionados.includes(id));

  // ✅ (2 - opcional UX) estado "indeterminate" cuando hay algunos, no todos
  const headerRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!headerRef.current) return;
    const alguno = idsVisibles.some((id) =>
      contactosSeleccionados.includes(id)
    );
    headerRef.current.indeterminate = alguno && !todosSeleccionados;
  }, [idsVisibles, contactosSeleccionados, todosSeleccionados]);

  return (
    <div className="w-full mt-6 shadow-lg rounded-lg">
      {/* Contenedor con scroll vertical + horizontal */}
      <div className="max-h-[500px] overflow-y-auto overflow-x-auto rounded-lg">
        <table className="min-w-[1000px] w-full bg-white border border-gray-200 text-sm">
          <thead className="bg-red-500 text-white text-xs uppercase sticky top-0 z-10 shadow-md">
            <tr>
              <th className="px-1 py-1 border text-xs">
                <input
                  ref={headerRef}
                  type="checkbox"
                  checked={todosSeleccionados}
                  // ✅ (1) handler explícito; evita warnings de tipo
                  onChange={() => toggleSeleccionTodos()}
                />
              </th>
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
                // ✅ (3) key estable con fallback si faltara id
                key={contacto.id ?? `${contacto.telefono}-${idx}`}
                contacto={contacto}
                editarContacto={editarContacto}
                eliminarContacto={eliminarContacto}
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
