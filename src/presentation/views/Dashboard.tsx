// src/presentation/views/Dashboard.tsx
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../index.css";

import ContactTable from "../components/ContactTable";
import ExportModal from "../components/ExportModal";
import ContactModalForm from "../components/ContactModalForm";
import QuickActions from "../components/QuickActions";
import DeletingOverlay from "../components/DeletingOverlay";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import cargandoLogo from "../../assets/img/cargando.webp";

import { useDashboardViewModel } from "../viewmodels/useDashboardViewModel";

function ImportingOverlay({
  open, progress, message,
}: {
  open: boolean; progress: number; message: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-[61] w-[92%] max-w-md rounded-2xl bg-white shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 text-center">Importando contactos</h3>
        <p className="mt-2 text-sm text-gray-600 text-center">{message}</p>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div className="bg-red-600 h-3 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm text-gray-700 text-center font-semibold">{progress}%</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const vm = useDashboardViewModel();

  if (vm.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <img src={cargandoLogo} alt="Logo" className="w-24 h-24 animate-pulse mb-4" />
        <span className="text-gray-600 text-lg animate-pulse font-semibold">
          Cargando contactos...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <main className="w-full p-2">
        <ToastContainer position="top-center" autoClose={3000} />

        <ImportingOverlay
          open={vm.isImporting}
          progress={vm.importProgress}
          message={vm.importMessage}
        />

        <h2 className="text-3xl font-bold text-center text-slate-600 mb-6">
          Gestión de Contactos
        </h2>

        <QuickActions actions={vm.quickActions} />

        {/* Modal importar */}
        {vm.isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => vm.setIsImportModalOpen(false)} />
            <div className="relative z-10 w-[92%] max-w-md rounded-2xl bg-white shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 text-center">Importar contactos</h2>
              <p className="mt-2 text-sm text-gray-600 text-center">
                La columna <b>categoria</b> debe ser <b>parlamento</b>, <b>diputado</b>, <b>senador</b> o <b>congresal</b>.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3">
                <button
                  onClick={vm.abrirSelectorArchivoImportacion}
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 hover:bg-gray-50 transition"
                >
                  📥 Importar archivo
                </button>
                <button
                  onClick={vm.handleDescargarPlantilla}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-slate-700 text-white px-4 py-3 hover:bg-slate-800 transition"
                >
                  ⬇️ Descargar plantilla
                </button>
              </div>
              <button
                onClick={() => vm.setIsImportModalOpen(false)}
                className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Formulario agregar/editar */}
        {vm.isFormOpen && (
          <ContactModalForm
            contacto={vm.formContact}
            modoEdicion={vm.isEditing}
            manejarCambio={vm.manejarCambioFormulario}
            manejarSubmit={vm.guardarContacto}
            onClose={() => vm.setIsFormOpen(false)}
          />
        )}

        {/* Modal exportar */}
        {vm.isExportModalOpen && (
          <ExportModal
            onClose={() => vm.setIsExportModalOpen(false)}
            onExportVCF={vm.handleExportVCF}
            onExportCSV={vm.handleExportCSV}
            onExportExcel={vm.handleExportExcel}
          />
        )}

        {/* Modal agregar */}
        {vm.isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => vm.setIsAddModalOpen(false)} />
            <div className="relative z-10 w-[92%] max-w-md rounded-2xl bg-white shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 text-center">Agregar contacto</h2>
              <p className="mt-2 text-sm text-gray-600 text-center">
                Selecciona cómo deseas agregar un nuevo contacto:
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3">
                <button
                  onClick={() => { vm.setIsAddModalOpen(false); vm.abrirFormularioNuevo(); }}
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 hover:bg-gray-50 transition"
                >
                  Manual
                </button>
                <button
                  onClick={() => { vm.setIsAddModalOpen(false); vm.abrirScannerViisan(); }}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-red-600 text-white px-4 py-3 hover:bg-red-700 transition"
                >
                  Automático (VIISAN)
                </button>
              </div>
              <button
                onClick={() => vm.setIsAddModalOpen(false)}
                className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Buscador + filtros */}
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Buscar por nombres, apellidos, teléfono o serie..."
                value={vm.searchText}
                onChange={(e) => vm.setSearchText(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
              />
            </div>
            <div className="flex items-center justify-between md:justify-end gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 select-none">
                <input
                  type="checkbox"
                  checked={vm.showInactive}
                  onChange={(e) => vm.setShowInactive(e.target.checked)}
                  className="accent-red-600"
                />
                Solo disponibles
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Total</span>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800">
                  {vm.filteredContacts.length}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {([null, "parlamento", "diputado", "senador", "congresal"] as const).map((cat) => (
              <button
                key={String(cat)}
                type="button"
                onClick={() => vm.setCategoryFilter(cat)}
                className={`px-2 py-0.5 text-xs rounded-md border transition ${
                  vm.categoryFilter === cat
                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {cat === null ? "Todos" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Eliminar masivo */}
        <div className="w-full mt-4 flex justify-between items-center">
          {vm.selectedIds.length > 0 && (
            <button
              onClick={vm.solicitarEliminacionMasiva}
              className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-transform transform hover:scale-110"
              title="Eliminar seleccionados"
            >
              🗑️
            </button>
          )}
        </div>

        {/* Confirmación */}
        <ConfirmDeleteModal
          open={vm.confirmOpen}
          title={vm.confirmTitle}
          message={vm.confirmMessage}
          confirmText="Sí, confirmar"
          cancelText="Cancelar"
          onConfirm={vm.handleConfirm}
          onClose={() => vm.setConfirmOpen(false)}
        />

        {/* Tabla */}
        <div className="w-full mt-1 max-h-[600px] overflow-y-auto">
          <ContactTable
            contactos={vm.filteredContacts}
            editarContacto={vm.abrirEdicion}
            eliminarContacto={vm.solicitarEliminacion}
            reactivarContacto={vm.solicitarReactivacion}
            contactosSeleccionados={vm.selectedIds}
            toggleSeleccion={vm.alternarSeleccion}
          />
        </div>

        <DeletingOverlay open={vm.isDeleting} progress={vm.deleteProgress} />
      </main>
    </div>
  );
}
