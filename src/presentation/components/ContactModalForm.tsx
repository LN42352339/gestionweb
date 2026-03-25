// src/presentation/components/ContactModalForm.tsx
import React from "react";
import { Contacto, Categoria } from "../../domain/entities/contact";

/**
 * =========================
 * Props del formulario modal
 * =========================
 * - contacto: objeto con los datos del formulario (state del Dashboard)
 * - modoEdicion: true si estamos editando, false si estamos creando
 * - manejarCambio: función que actualiza el state cuando escribes en inputs/select
 * - manejarSubmit: función que valida y guarda (crea o actualiza)
 * - onClose: cierra el modal
 */
type ContactModalFormProps = {
  contacto: Contacto;
  modoEdicion: boolean;
  manejarCambio: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  manejarSubmit: () => void | Promise<void>;
  onClose: () => void;
};

/**
 * =========================
 * Opciones del Select Categoría
 * =========================
 * Esto alimenta el <select> para que el usuario elija la categoría.
 */
const opcionesCategoria: Array<{ label: string; value: Categoria }> = [
  { label: "Parlamento", value: "parlamento" },
  { label: "Diputado", value: "diputado" },
  { label: "Senador", value: "senador" },
];

export default function ContactModalForm({
  contacto,
  modoEdicion,
  manejarCambio,
  manejarSubmit,
  onClose,
}: ContactModalFormProps) {
  return (
    /**
     * =========================
     * Contenedor del modal
     * =========================
     * fixed inset-0: cubre toda la pantalla
     * z-50: asegura que esté por encima del resto
     */
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* =========================
          FONDO OSCURO (backdrop)
          =========================
          - Si haces click fuera, se cierra el modal.
        */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* =========================
          CAJA DEL MODAL
          ========================= */}
      <div className="relative z-10 w-[96%] max-w-3xl rounded-2xl bg-white shadow-xl border border-gray-200 p-5 md:p-6">
        {/* =========================
            CABECERA (título + botón X)
            ========================= */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">
            {modoEdicion ? "Editar contacto" : "Agregar contacto"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* =========================
            FORMULARIO
            =========================
            - Usamos <form> para que "Enter" también guarde.
            - evitamos recargar la página con e.preventDefault()
          */}
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            void manejarSubmit();
          }}
        >
          {/* =========================
              GRID DE CAMPOS
              =========================
              - 1 columna en móvil
              - 2 columnas en pantallas medianas
            */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* ======= Datos personales ======= */}
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Primer nombre *
              </label>
              <input
                name="primerNombre"
                value={contacto.primerNombre ?? ""}
                onChange={manejarCambio}
                placeholder="EJ: JUAN"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">
                Segundo nombre
              </label>
              <input
                name="segundoNombre"
                value={contacto.segundoNombre ?? ""}
                onChange={manejarCambio}
                placeholder="EJ: CARLOS"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">
                Primer apellido *
              </label>
              <input
                name="primerApellido"
                value={contacto.primerApellido ?? ""}
                onChange={manejarCambio}
                placeholder="EJ: PEREZ"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">
                Segundo apellido
              </label>
              <input
                name="segundoApellido"
                value={contacto.segundoApellido ?? ""}
                onChange={manejarCambio}
                placeholder="EJ: LOPEZ"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
              />
            </div>

            {/* ======= Datos laborales ======= */}
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Área *
              </label>
              <input
                name="area"
                value={contacto.area ?? ""}
                onChange={manejarCambio}
                placeholder="EJ: SISTEMAS"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">
                Operador *
              </label>
              <input
                name="operador"
                value={contacto.operador ?? ""}
                onChange={manejarCambio}
                placeholder="EJ: CLARO / MOVISTAR"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
              />
            </div>

            {/* ======= Teléfono / Equipo ======= */}
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Teléfono (9 dígitos) *
              </label>
              <input
                name="telefono"
                value={contacto.telefono ?? ""}
                onChange={manejarCambio}
                inputMode="numeric"
                placeholder="EJ: 987654321"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">
                IMEI / Serie (15 dígitos) *
              </label>
              <input
                name="serie"
                value={contacto.serie ?? ""}
                onChange={manejarCambio}
                inputMode="numeric"
                placeholder="EJ: 356789012345678"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">
                Marca *
              </label>
              <input
                name="marca"
                value={contacto.marca ?? ""}
                onChange={manejarCambio}
                placeholder="EJ: SAMSUNG"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">
                Modelo *
              </label>
              <input
                name="modelo"
                value={contacto.modelo ?? ""}
                onChange={manejarCambio}
                placeholder="EJ: S23"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
              />
            </div>

            {/* ======= Fecha / Categoría ======= */}
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Fecha de atención *
              </label>
              <input
                type="date"
                name="fechaAtencion"
                value={contacto.fechaAtencion ?? ""}
                onChange={manejarCambio}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">
                Categoría *
              </label>
              <select
                name="categoria"
                value={contacto.categoria ?? "parlamento"}
                onChange={manejarCambio}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
              >
                {opcionesCategoria.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* =========================
              BOTONES (acciones)
              ========================= */}
          <div className="mt-5 flex flex-col-reverse md:flex-row items-stretch md:items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 active:scale-[0.99] transition"
            >
              {modoEdicion ? "Guardar cambios" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
