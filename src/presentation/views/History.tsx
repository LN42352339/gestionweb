// src/presentation/views/History.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

import { ContactoConHistorial } from "../../domain/entities/contact";
import { obtenerHistorial } from "../../data/datasources/historialService";

function formatoFecha(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);

  // ✅ Perú
  return d.toLocaleString("es-PE", { timeZone: "America/Lima" });
}

function etiquetaCategoria(raw: unknown): string {
  const v = String(raw ?? "").toLowerCase().trim();
  if (v === "parlamento") return "Parlamento";
  if (v === "diputado") return "Diputado";
  if (v === "senador") return "Senador";
  if (v === "congresal") return "Congresal";
  return "Parlamento";
}

function etiquetaMovimiento(raw: unknown): string {
  const v = String(raw ?? "").toUpperCase().trim();

  if (v === "BAJA_PERSONA") return "Baja de persona";
  if (v === "REACTIVACION") return "Reactivación";
  if (v === "ASIGNACION") return "Asignación";
  if (v === "ACTUALIZACION") return "Actualización";

  if (v === "CAMBIO_EQUIPO") return "Cambio de equipo";
  if (v === "CAMBIO_NUMERO") return "Cambio de número";
  if (v === "CAMBIO_NUMERO_Y_EQUIPO") return "Cambio de número + equipo";

  return v || "-";
}

const History = () => {
  const [historial, setHistorial] = useState<ContactoConHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const data = await obtenerHistorial();
        setHistorial(data);
      } catch (error) {
        console.error("Error al obtener historial:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarHistorial();
  }, []);

  const historialLimpio = useMemo(() => {
    return historial
      .filter((c) => {
        const nombre = String(
          c.nombreCompleto ?? `${c.primerNombre ?? ""} ${c.primerApellido ?? ""}`
        )
          .toUpperCase()
          .trim();

        return nombre !== "";
      })
      // ✅ Orden por último movimiento (createdAt)
      .sort((a, b) => {
        const fa = new Date(a.createdAt ?? 0).getTime();
        const fb = new Date(b.createdAt ?? 0).getTime();
        return fb - fa;
      });
  }, [historial]);

  const exportarHistorialAExcel = () => {
    if (historialLimpio.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const dataParaExcel = historialLimpio.map((c) => ({
      Nombre: (
        c.nombreCompleto || `${c.primerNombre ?? ""} ${c.primerApellido ?? ""}`
      )
        .trim(),
      Teléfono: c.telefono,
      Área: c.area,
      Categoría: etiquetaCategoria(c.categoria),
      Marca: c.marca || "-",
      Modelo: c.modelo || "-",
      Serie: c.serie || "-",
      Movimiento: etiquetaMovimiento(c.tipoMovimiento),
      Estado: c.estado ?? "INACTIVO",
      "Fecha movimiento": formatoFecha(c.createdAt),
      Observación: c.observacion ?? "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataParaExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historial");

    XLSX.writeFile(workbook, "historial_contactos.xlsx");
  };

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
                    {(
                      c.nombreCompleto ||
                      `${c.primerNombre ?? ""} ${c.primerApellido ?? ""}`
                    ).trim()}
                  </td>
                  <td className="py-2 px-4 border">{c.telefono}</td>
                  <td className="py-2 px-4 border">{c.area}</td>
                  <td className="py-2 px-4 border">
                    {etiquetaCategoria(c.categoria)}
                  </td>
                  <td className="py-2 px-4 border">{c.marca || "-"}</td>
                  <td className="py-2 px-4 border">{c.modelo || "-"}</td>
                  <td className="py-2 px-4 border">{c.serie || "-"}</td>
                  <td className="py-2 px-4 border">
                    {etiquetaMovimiento(c.tipoMovimiento)}
                  </td>
                  <td className="py-2 px-4 border">
                    <span className="inline-flex px-2 py-1 rounded bg-gray-200 text-gray-800 font-semibold">
                      {c.estado ?? "INACTIVO"}
                    </span>
                  </td>
                  <td className="py-2 px-4 border">
                    {formatoFecha(c.createdAt)}
                  </td>
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
