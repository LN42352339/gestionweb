// src/components/ContactForm.tsx
import React from "react";
import { Contacto } from "../../domain/entities/contact";

type Categoria = "parlamento" | "congresal";

interface ContactFormProps {
  contacto: Contacto;
  modoEdicion: boolean;
  manejarCambio: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  manejarSubmit: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({
  contacto,
  modoEdicion,
  manejarCambio,
  manejarSubmit,
}) => {
  const hoyISO = new Date().toISOString().slice(0, 10);

  // ✅ Manejo especial para TELÉFONO (Perú): solo números, máximo 9
  const manejarCambioTelefono = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const digits = String(e.target.value).replace(/\D+/g, "").slice(0, 9);

    manejarCambio({
      ...e,
      target: { ...e.target, name: "telefono", value: digits },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  // ✅ Manejo especial para SERIE/IMEI: solo números, máximo 15
  const manejarCambioSerie = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const digits = String(e.target.value).replace(/\D+/g, "").slice(0, 15);

    manejarCambio({
      ...e,
      target: { ...e.target, name: "serie", value: digits },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const letrasPattern = "^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        manejarSubmit();
      }}
    >
      <h3 className="text-2xl font-bold mb-4 text-slate-700 text-center">
        {modoEdicion ? "Editar Contacto" : "Nuevo Contacto"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NOMBRES */}
        <input
          type="text"
          name="primerNombre"
          placeholder="Primer Nombre"
          value={contacto.primerNombre}
          onChange={manejarCambio}
          required
          pattern={letrasPattern}
          title="Solo letras y espacios (sin números)"
          className="p-2 border border-gray-300 rounded"
        />

        <input
          type="text"
          name="segundoNombre"
          placeholder="Segundo Nombre (opcional)"
          value={contacto.segundoNombre || ""}
          onChange={manejarCambio}
          pattern={letrasPattern}
          title="Solo letras y espacios (sin números)"
          className="p-2 border border-gray-300 rounded"
        />

        {/* APELLIDOS */}
        <input
          type="text"
          name="primerApellido"
          placeholder="Primer Apellido"
          value={contacto.primerApellido}
          onChange={manejarCambio}
          required
          pattern={letrasPattern}
          title="Solo letras y espacios (sin números)"
          className="p-2 border border-gray-300 rounded"
        />

        <input
          type="text"
          name="segundoApellido"
          placeholder="Segundo Apellido (opcional)"
          value={contacto.segundoApellido || ""}
          onChange={manejarCambio}
          pattern={letrasPattern}
          title="Solo letras y espacios (sin números)"
          className="p-2 border border-gray-300 rounded"
        />

        {/* ÁREA */}
        <input
          type="text"
          name="area"
          placeholder="Área"
          value={contacto.area}
          onChange={manejarCambio}
          required
          className="p-2 border border-gray-300 rounded"
        />

        {/* FECHA DE ATENCIÓN (NO FUTURA) */}
        <input
          type="date"
          name="fechaAtencion"
          value={contacto.fechaAtencion}
          onChange={manejarCambio}
          required
          max={hoyISO}
          title="La fecha de atención no puede ser mayor a la fecha actual"
          className="p-2 border border-gray-300 rounded"
        />

        {/* OPERADOR */}
        <select
          name="operador"
          value={contacto.operador || ""}
          onChange={manejarCambio}
          required
          className="p-2 border border-gray-300 rounded bg-white"
          title="Seleccione un operador"
        >
          <option value="">Seleccione operador</option>
          <option value="CLARO">CLARO</option>
          <option value="MOVISTAR">MOVISTAR</option>
          <option value="ENTEL">ENTEL</option>
          <option value="BITEL">BITEL</option>
        </select>

        {/* ✅ CATEGORÍA */}
        <select
          name="categoria"
          value={((contacto.categoria ?? "congresal") as Categoria) || "congresal"}
          onChange={manejarCambio}
          required
          className="p-2 border border-gray-300 rounded bg-white"
          title="Seleccione una categoría"
        >
          <option value="congresal">CONGRESAL</option>
          <option value="parlamento">PARLAMENTO</option>
        </select>

        {/* TELÉFONO PERÚ */}
        <input
          type="text"
          name="telefono"
          placeholder="Teléfono (Perú - 9 dígitos, empieza con 9)"
          value={contacto.telefono}
          onChange={manejarCambioTelefono}
          required
          inputMode="numeric"
          pattern="^9\d{8}$"
          maxLength={9}
          title="El teléfono debe tener 9 dígitos y comenzar con 9 (Perú)"
          className="p-2 border border-gray-300 rounded"
        />

        {/* MARCA */}
        <div className="flex flex-col">
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
        </div>

        {/* MODELO */}
        <input
          type="text"
          name="modelo"
          placeholder="Modelo del equipo"
          value={contacto.modelo}
          onChange={manejarCambio}
          required
          className="p-2 border border-gray-300 rounded"
        />

        {/* SERIE/IMEI */}
        <input
          type="text"
          name="serie"
          placeholder="IMEI / Serie (15 dígitos)"
          value={contacto.serie}
          onChange={manejarCambioSerie}
          required
          inputMode="numeric"
          pattern="^[0-9]{15}$"
          maxLength={15}
          title="El IMEI debe tener exactamente 15 dígitos numéricos"
          className="p-2 border border-gray-300 rounded"
        />
      </div>

      <p className="text-xs text-gray-500 mt-2">
        * Teléfono: 9 dígitos y comienza con 9 (Perú). IMEI/Serie: exactamente 15 dígitos.
        La fecha de atención no puede ser mayor a hoy.
      </p>

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

