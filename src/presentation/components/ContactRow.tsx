// src/components/ContactRow.tsx
import { FaEdit, FaTrash } from "react-icons/fa";
import { Contacto } from "../../domain/entities/contact";
import React from "react";
import { formatTelefonoPE, formatFechaDMY } from "../../utils/format";

interface ContactRowProps {
  contacto: Contacto;
  editarContacto: (contacto: Contacto) => void;
  eliminarContacto: (id: string | undefined) => void;
  seleccionado: boolean;
  toggleSeleccion: (id: string) => void;
}

const ContactRow: React.FC<ContactRowProps> = ({
  contacto,
  editarContacto,
  eliminarContacto,
  seleccionado,
  toggleSeleccion,
}) => {
  const id = contacto.id ?? "";
  const canAct = Boolean(contacto.id);

  const fullName = [
    contacto.primerApellido,
    contacto.segundoApellido,
    contacto.primerNombre,
    contacto.segundoNombre,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <tr className="border-b hover:bg-gray-100 transition duration-200 text-sm">
      <td className="px-1 py-0.5 border text-xs text-center">
        <input
          type="checkbox"
          checked={seleccionado}
          disabled={!canAct}
          onChange={() => canAct && toggleSeleccion(id)}
        />
      </td>

      {/* Nombre completo */}
      <td className="px-2 py-1 border text-xs">{fullName}</td>
      <td className="px-2 py-1 border text-xs whitespace-nowrap tabular-nums">
        {formatTelefonoPE(contacto.telefono)}
      </td>
      <td className="px-2 py-1 border text-xs">{contacto.area}</td>
      <td className="px-2 py-1 border text-xs">{contacto.marca}</td>
      <td className="px-2 py-1 border text-xs">{contacto.modelo}</td>
      <td className="px-2 py-1 border text-xs">
        {String(contacto.serie ?? "")}
      </td>
      <td className="px-2 py-1 border text-xs">{contacto.operador}</td>
      <td className="px-2 py-1 border text-xs">
        {formatFechaDMY(contacto.fechaAtencion)}
      </td>

      <td className="px-2 py-1 border text-center space-x-1">
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => editarContacto(contacto)}
            className={`${
              canAct
                ? "text-blue-600 hover:text-blue-800"
                : "text-gray-300 cursor-not-allowed"
            }`}
            title={canAct ? "Editar" : "Sin ID para editar"}
            disabled={!canAct}
          >
            <FaEdit />
          </button>
          <button
            onClick={() => canAct && eliminarContacto(id)}
            className={`${
              canAct
                ? "text-red-600 hover:text-red-800"
                : "text-gray-300 cursor-not-allowed"
            }`}
            title={canAct ? "Eliminar" : "Sin ID para eliminar"}
            disabled={!canAct}
          >
            <FaTrash />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ContactRow;
