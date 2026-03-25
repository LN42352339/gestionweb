// src/presentation/components/ContactForm.tsx
import React from "react";
import { Contacto } from "../../domain/entities/contact";

interface ContactFormProps {
  contacto: Contacto;
  modoEdicion: boolean;
  manejarCambio: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  manejarSubmit: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({
  contacto,
  modoEdicion,
  manejarCambio,
  manejarSubmit,
}) => {
  const hoyISO = new Date().toISOString().slice(0, 10);
  const letrasPattern = "^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$";

  const manejarCambioTelefono = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D+/g, "").slice(0, 9);
    manejarCambio({
      ...e,
      target: { ...e.target, name: "telefono", value: digits },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const manejarCambioSerie = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D+/g, "").slice(0, 15);
    manejarCambio({
      ...e,
      target: { ...e.target, name: "serie", value: digits },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        manejarSubmit();
      }}
    >
      <h3 className="text-2xl font-bold mb-4 text-slate-700 text-center">
        {modoEdicion ? "Editar Contacto" : "Nuevo Contacto"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="primerNombre"
          placeholder="Primer Nombre"
          value={contacto.primerNombre}
          onChange={manejarCambio}
          required
          pattern={letrasPattern}
          className="p-2 border border-gray-300 rounded"
        />

        <input
          type="text"
          name="segundoNombre"
          placeholder="Segundo Nombre (opcional)"
          value={contacto.segundoNombre || ""}
          onChange={manejarCambio}
          pattern={letrasPattern}
          className="p-2 border border-gray-300 rounded"
        />

        <input
          type="text"
          name="primerApellido"
          placeholder="Primer Apellido"
          value={contacto.primerApellido}
          onChange={manejarCambio}
          required
          pattern={letrasPattern}
          className="p-2 border border-gray-300 rounded"
        />

        <input
          type="text"
          name="segundoApellido"
          placeholder="Segundo Apellido (opcional)"
          value={contacto.segundoApellido || ""}
          onChange={manejarCambio}
          pattern={letrasPattern}
          className="p-2 border border-gray-300 rounded"
        />

        <input
          type="text"
          name="area"
          placeholder="Área"
          value={contacto.area}
          onChange={manejarCambio}
          required
          className="p-2 border border-gray-300 rounded"
        />

        <input
          type="date"
          name="fechaAtencion"
          value={contacto.fechaAtencion}
          onChange={manejarCambio}
          required
          max={hoyISO}
          className="p-2 border border-gray-300 rounded"
        />

        <select
          name="operador"
          value={contacto.operador || ""}
          onChange={manejarCambio}
          required
          className="p-2 border border-gray-300 rounded bg-white"
        >
          <option value="">Seleccione operador</option>
          <option value="CLARO">CLARO</option>
          <option value="MOVISTAR">MOVISTAR</option>
          <option value="ENTEL">ENTEL</option>
          <option value="BITEL">BITEL</option>
        </select>

        {/* ✅ CATEGORÍA 2026 */}
        <select
          name="categoria"
          value={contacto.categoria}
          onChange={manejarCambio}
          required
          className="p-2 border border-gray-300 rounded bg-white"
        >
          <option value="parlamento">PARLAMENTO</option>
          <option value="diputado">DIPUTADO</option>
          <option value="senador">SENADOR</option>
        </select>

        <input
          type="text"
          name="telefono"
          placeholder="Teléfono (9 dígitos)"
          value={contacto.telefono}
          onChange={manejarCambioTelefono}
          required
          inputMode="numeric"
          maxLength={9}
          className="p-2 border border-gray-300 rounded"
        />

        <input
          type="text"
          name="marca"
          placeholder="Marca del equipo"
          value={contacto.marca}
          onChange={manejarCambio}
          required
          list="marcas"
          className="p-2 border border-gray-300 rounded"
        />

        <datalist id="marcas">
          <option value="SAMSUNG" />
          <option value="APPLE" />
          <option value="XIAOMI" />
          <option value="MOTOROLA" />
          <option value="HONOR" />
        </datalist>

        <input
          type="text"
          name="modelo"
          placeholder="Modelo del equipo"
          value={contacto.modelo}
          onChange={manejarCambio}
          required
          className="p-2 border border-gray-300 rounded"
        />

        <input
          type="text"
          name="serie"
          placeholder="IMEI / Serie (15 dígitos)"
          value={contacto.serie}
          onChange={manejarCambioSerie}
          required
          inputMode="numeric"
          maxLength={15}
          className="p-2 border border-gray-300 rounded"
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition"
        >
          {modoEdicion ? "Actualizar" : "Guardar"}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
