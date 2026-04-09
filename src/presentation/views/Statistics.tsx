// src/presentation/views/Statistics.tsx
import { useNavigate } from "react-router-dom";
import StatisticsDashboard from "../components/StatisticsDashboard";
import { useStatisticsViewModel } from "../viewmodels/useStatisticsViewModel";
import { Categoria } from "../../domain/entities/contact";

export default function EstadisticasPage() {
  const navigate = useNavigate();
  const {
    cargando,
    categoriaFiltro,
    setCategoriaFiltro,
    contactosFiltrados,
    disponibles,
    eliminados,
    equiposDisponiblesDetalle,
    datosArea,
    areaConMasContactos,
    cantidadActivos,
  } = useStatisticsViewModel();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-600 animate-pulse">Cargando estadísticas...</p>
      </div>
    );
  }

  const categorias: { value: Categoria | null; label: string }[] = [
    { value: null, label: "Todos" },
    { value: "parlamento", label: "Parlamento" },
    { value: "diputado", label: "Diputado" },
    { value: "senador", label: "Senador" },
    { value: "congresal", label: "Congresal" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col">
      {/* Barra superior */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 print-hide">
        <h2 className="text-3xl font-bold text-slate-700">Estadísticas de Contactos</h2>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-800"
          >
            🖨️ Imprimir reporte
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ← Volver
          </button>
        </div>
      </div>

      {/* Filtro por categoría */}
      <div className="mb-4 print-hide bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <p className="text-sm text-gray-600 mb-2 font-semibold">
          Filtrar Dashboard por categoría
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {categorias.map(({ value, label }) => (
            <button
              key={String(value)}
              type="button"
              onClick={() => setCategoriaFiltro(value)}
              className={`px-3 py-1 text-sm rounded-md border transition ${
                categoriaFiltro === value
                  ? "bg-red-600 text-white border-red-600 shadow-sm"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-600">
            Contactos en vista: <b className="text-gray-900">{contactosFiltrados.length}</b>
          </span>
        </div>
      </div>

      {/* Reporte */}
      <div id="reporte-estadisticas">
        <StatisticsDashboard
          datosGrafico={datosArea}
          cantidadContactos={cantidadActivos}
          cantidadEliminados={eliminados}
          areaConMasContactos={areaConMasContactos}
          cantidadDisponibles={disponibles}
          equiposDisponibles={equiposDisponiblesDetalle}
        />
      </div>
    </div>
  );
}
