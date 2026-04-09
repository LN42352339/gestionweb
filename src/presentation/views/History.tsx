// src/presentation/views/History.tsx
import { useNavigate } from "react-router-dom";
import { useHistoryViewModel } from "../viewmodels/useHistoryViewModel";

const History = () => {
  const navigate = useNavigate();
  const {
    cargando,
    historialLimpio,
    exportarHistorialAExcel,
    formatoFechaDisplay,
    etiquetaCategoria,
    etiquetaMovimiento,
  } = useHistoryViewModel();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Historial de Movimientos (Contactos)
        </h2>

        <div className="flex gap-2">
          <button
            onClick={exportarHistorialAExcel}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            📁 Exportar a Excel
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ← Volver
          </button>
        </div>
      </div>

      {cargando ? (
        <p className="text-center text-gray-500">Cargando historial...</p>
      ) : historialLimpio.length === 0 ? (
        <p className="text-center text-gray-500">No hay movimientos.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow p-4">
          <table className="min-w-full text-sm border">
            <thead className="bg-red-500 text-white">
              <tr>
                <th className="py-2 px-4 border">Nombre</th>
                <th className="py-2 px-4 border">Teléfono</th>
                <th className="py-2 px-4 border">Área</th>
                <th className="py-2 px-4 border">Categoría</th>
                <th className="py-2 px-4 border">Marca</th>
                <th className="py-2 px-4 border">Modelo</th>
                <th className="py-2 px-4 border">Serie</th>
                <th className="py-2 px-4 border">Movimiento</th>
                <th className="py-2 px-4 border">Estado</th>
                <th className="py-2 px-4 border">Fecha</th>
              </tr>
            </thead>

            <tbody>
              {historialLimpio.map((c) => (
                <tr key={c.id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border">
                    {(c.nombreCompleto || `${c.primerNombre ?? ""} ${c.primerApellido ?? ""}`).trim()}
                  </td>
                  <td className="py-2 px-4 border">{c.telefono}</td>
                  <td className="py-2 px-4 border">{c.area}</td>
                  <td className="py-2 px-4 border">{etiquetaCategoria(c.categoria)}</td>
                  <td className="py-2 px-4 border">{c.marca || "-"}</td>
                  <td className="py-2 px-4 border">{c.modelo || "-"}</td>
                  <td className="py-2 px-4 border">{c.serie || "-"}</td>
                  <td className="py-2 px-4 border">{etiquetaMovimiento(c.tipoMovimiento)}</td>
                  <td className="py-2 px-4 border">
                    <span className="inline-flex px-2 py-1 rounded bg-gray-200 text-gray-800 font-semibold">
                      {c.estado ?? "INACTIVO"}
                    </span>
                  </td>
                  <td className="py-2 px-4 border">{formatoFechaDisplay(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default History;
