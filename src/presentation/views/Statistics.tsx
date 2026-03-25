// src/presentation/views/Stadistics.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// ✅ Componente que pinta las tarjetas y gráficos
import StatisticsDashboard, {
  PuntoArea,
  EquipoDisponible,
} from "../components/StatisticsDashboard";

// ✅ Fuente principal de contactos (Firestore -> repositorio -> usecase)
import { obtenerContactos } from "../../data/datasources/contactService";
import { Contacto, Categoria } from "../../domain/entities/contact";

// ✅ Firestore directo SOLO para métricas del historial (eliminados reales)
import {
  collection,
  query,
  where,
  getCountFromServer, // ✅ cuenta sin descargar todo
} from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

/** =========================
 *  CONFIG: Cuántas áreas mostrar en el top
 *  ========================= */
const TOP_AREAS = 8;

/** =========================
 *  HELPERS: utilidades simples y entendibles
 *  ========================= */

/** Normaliza categoría para comparar */
function normalizarCategoria(raw: unknown): Categoria | null {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "parlamento" || v === "diputado" || v === "senador") return v as Categoria;
  return null;
}

/** Un contacto es "DISPONIBLE" cuando está INACTIVO (tu regla actual) */
function esDisponible(contacto: Contacto): boolean {
  return contacto.estado === "INACTIVO";
}

/** Devuelve el texto del área de forma segura */
function obtenerAreaSafe(contacto: Contacto): string {
  return String(contacto.area ?? "SIN ÁREA").toUpperCase().trim();
}

export default function EstadisticasPage() {
  /** =========================
   *  STATE: datos base
   *  ========================= */
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [eliminados, setEliminados] = useState<number>(0);
  const [cargando, setCargando] = useState(true);

  /** =========================
   *  STATE: filtros de pantalla
   *  ========================= */
  const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria | null>(null);

  const navigate = useNavigate();

  /** =========================
   *  CARGA INICIAL: contactos + eliminados reales
   *  ========================= */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);

        // ✅ 1) Traer contactos (tu fuente principal)
        const listaContactos = await obtenerContactos();
        setContactos(listaContactos);

        // ✅ 2) Contar eliminados reales desde historial (solo BAJA_PERSONA)
        //     - Esto NO cuenta actualizaciones/asignaciones/reactivaciones
        const countSnap = await getCountFromServer(
          query(
            collection(db, "historialContactos"),
            where("tipoMovimiento", "==", "BAJA_PERSONA")
          )
        );
        setEliminados(countSnap.data().count);
      } catch (error) {
        console.error("Error al obtener estadísticas:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  /** =========================
   *  CONTACTOS FILTRADOS POR CATEGORÍA
   *  ========================= */
  const contactosFiltrados = useMemo(() => {
    if (!categoriaFiltro) return contactos;

    return contactos.filter((c) => {
      const cat = normalizarCategoria(c.categoria);
      return cat === categoriaFiltro;
    });
  }, [contactos, categoriaFiltro]);

  /** =========================
   *  MÉTRICA: DISPONIBLES (plazas liberadas)
   *  Regla: estado INACTIVO
   *  ========================= */
  const disponibles = useMemo(() => {
    return contactosFiltrados.filter((c) => esDisponible(c)).length;
  }, [contactosFiltrados]);

  /** =========================
   *  DETALLE: EQUIPOS DISPONIBLES (para tu panel con scroll)
   *  Sale desde contactos INACTIVOS
   *  Campos: numero, marca, modelo, imei
   *  ========================= */
  const equiposDisponiblesDetalle: EquipoDisponible[] = useMemo(() => {
    return contactosFiltrados
      .filter((c) => esDisponible(c))
      .map((c) => ({
        numero: String(c.telefono ?? ""),
        marca: String(c.marca ?? "").toUpperCase(),
        modelo: String(c.modelo ?? "").toUpperCase(),
        imei: String(c.serie ?? ""),
      }));
  }, [contactosFiltrados]);

  /** =========================
   *  DATOS PARA GRÁFICO: contactos por área
   *  Regla: SOLO ACTIVOS (para estadísticas reales)
   *  ========================= */
  const datosArea: PuntoArea[] = useMemo(() => {
    const agrupado: Record<string, number> = {};

    for (const c of contactosFiltrados) {
      // ✅ Solo activos cuentan para "área con contactos asignados"
      if (c.estado === "INACTIVO") continue;

      const area = obtenerAreaSafe(c);

      // 🚫 Evita valores basura (por si acaso)
      if (area === "DISPONIBLE" || area === "PENDIENTE") continue;

      agrupado[area] = (agrupado[area] || 0) + 1;
    }

    // Ordenamos de mayor a menor
    const listaOrdenada = Object.entries(agrupado)
      .map(([area, cantidad]) => ({ area, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    // Si no pasa el top, devolvemos tal cual
    if (listaOrdenada.length <= TOP_AREAS) return listaOrdenada;

    // Si hay más áreas, agrupamos en "OTROS"
    const top = listaOrdenada.slice(0, TOP_AREAS);
    const resto = listaOrdenada.slice(TOP_AREAS);
    const totalOtros = resto.reduce((acc, x) => acc + x.cantidad, 0);

    return totalOtros > 0 ? [...top, { area: "OTROS", cantidad: totalOtros }] : top;
  }, [contactosFiltrados]);

  /** =========================
   *  KPI: Área con más contactos (solo activos)
   *  ========================= */
  const areaConMasContactos = useMemo(() => {
    return datosArea.find((d) => d.area !== "OTROS")?.area ?? "Sin datos";
  }, [datosArea]);

  /** =========================
   *  UI: Loading
   *  ========================= */
  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-600 animate-pulse">
          Cargando estadísticas...
        </p>
      </div>
    );
  }

  /** =========================
   *  UI: Pantalla principal
   *  ========================= */
  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col">
      {/* =========================
         BARRA SUPERIOR (título + acciones)
         ========================= */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 print-hide">
        <h2 className="text-3xl font-bold text-slate-700">
          Estadísticas de Contactos
        </h2>

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

      {/* =========================
         FILTRO POR CATEGORÍA
         ========================= */}
      <div className="mb-4 print-hide bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <p className="text-sm text-gray-600 mb-2 font-semibold">
          Filtrar Dashboard por categoría
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategoriaFiltro(null)}
            className={`px-3 py-1 text-sm rounded-md border transition ${
              categoriaFiltro === null
                ? "bg-red-600 text-white border-red-600 shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Todos
          </button>

          <button
            type="button"
            onClick={() => setCategoriaFiltro("parlamento")}
            className={`px-3 py-1 text-sm rounded-md border transition ${
              categoriaFiltro === "parlamento"
                ? "bg-red-600 text-white border-red-600 shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Parlamento
          </button>

          <button
            type="button"
            onClick={() => setCategoriaFiltro("diputado")}
            className={`px-3 py-1 text-sm rounded-md border transition ${
              categoriaFiltro === "diputado"
                ? "bg-red-600 text-white border-red-600 shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Diputado
          </button>

          <button
            type="button"
            onClick={() => setCategoriaFiltro("senador")}
            className={`px-3 py-1 text-sm rounded-md border transition ${
              categoriaFiltro === "senador"
                ? "bg-red-600 text-white border-red-600 shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Senador
          </button>

          <span className="ml-auto text-sm text-gray-600">
            Contactos en vista:{" "}
            <b className="text-gray-900">{contactosFiltrados.length}</b>
          </span>
        </div>
      </div>

      {/* =========================
         REPORTE (tarjetas + gráficos)
         ========================= */}
      <div id="reporte-estadisticas">
        <StatisticsDashboard
          datosGrafico={datosArea}
          cantidadContactos={
            // ✅ contactos en vista = SOLO ACTIVOS (más real para “cantidad contactos”)
            contactosFiltrados.filter((c) => c.estado !== "INACTIVO").length
          }
          cantidadEliminados={eliminados}
          areaConMasContactos={areaConMasContactos}
          cantidadDisponibles={disponibles}
          equiposDisponibles={equiposDisponiblesDetalle}
        />
      </div>
    </div>
  );
}
