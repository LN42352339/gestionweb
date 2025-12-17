import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatisticsDashboard, {PuntoArea,} from "../components/StatisticsDashboard";
import { obtenerContactos } from "../../data/datasources/contactService";
import { Contacto } from "../../domain/entities/contact";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

export default function EstadisticasPage() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [eliminados, setEliminados] = useState<number>(0);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const lista = await obtenerContactos();
        setContactos(lista);

        const historialSnap = await getDocs(
          collection(db, "historialContactos")
        );
        setEliminados(historialSnap.size);
      } catch (error) {
        console.error("Error al obtener estadísticas:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  // 🔢 Conteo de "DISPONIBLE" (cambia c.area por el campo correcto si es otro)
  const disponibles = useMemo(() => {
    return contactos.filter((c) =>
      (c.area || "").toUpperCase().includes("DISPONIBLE")
    ).length;
  }, [contactos]);

  // 📊 Agrupar por área
  const datosArea: PuntoArea[] = useMemo(() => {
    const agrupado: Record<string, number> = {};
    for (const c of contactos) {
      const area = (c.area || "SIN ÁREA").toUpperCase();
      agrupado[area] = (agrupado[area] || 0) + 1;
    }
    return Object.entries(agrupado)
      .map(([area, cantidad]) => ({ area, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [contactos]);

  const areaConMasContactos = useMemo(
    () => datosArea[0]?.area ?? "Sin datos",
    [datosArea]
  );

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-600 animate-pulse">
          Cargando estadísticas...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-slate-700">
          Estadísticas de Contactos
        </h2>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          ← Volver
        </button>
      </div>

      <div className="flex-grow overflow-auto">
        <StatisticsDashboard
          datosGrafico={datosArea}
          cantidadContactos={contactos.length}
          cantidadEliminados={eliminados}
          areaConMasContactos={areaConMasContactos}
          cantidadDisponibles={disponibles} // 👈 NUEVO
        />
      </div>
    </div>
  );
}
