// src/presentation/views/History.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

import { ContactoConHistorial } from "../../domain/entities/contact";
import { obtenerHistorial } from "../../data/datasources/historialService";

const History = () => {
  const [historial, setHistorial] = useState<ContactoConHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const contactos = await obtenerHistorial();
        setHistorial(contactos);
      } catch (error) {
        console.error("Error al obtener historial:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarHistorial();
  }, []);

  const exportarHistorialAExcel = () => {
    if (historial.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const dataParaExcel = historial.map((contacto) => ({
      Nombre: `${contacto.primerNombre} ${contacto.primerApellido}`,
      Teléfono: contacto.telefono,
      Área: contacto.area,
      "Eliminado en": new Date(contacto.eliminadoEn).toLocaleString(),
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
          Historial de Contactos Eliminados
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
      ) : historial.length === 0 ? (
        <p className="text-center text-gray-500">
          No hay contactos eliminados.
        </p>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow p-4">
          <table className="min-w-full text-sm border">
            <thead className="bg-red-500 text-white">
              <tr>
                <th className="py-2 px-4 border">Nombre</th>
                <th className="py-2 px-4 border">Teléfono</th>
                <th className="py-2 px-4 border">Área</th>
                <th className="py-2 px-4 border">Eliminado en</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((contacto) => (
                <tr key={contacto.id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border">
                    {contacto.primerNombre} {contacto.primerApellido}
                  </td>
                  <td className="py-2 px-4 border">{contacto.telefono}</td>
                  <td className="py-2 px-4 border">{contacto.area}</td>
                  <td className="py-2 px-4 border">
                    {new Date(contacto.eliminadoEn).toLocaleString()}
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
