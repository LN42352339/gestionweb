// src/presentation/viewmodels/useStatisticsViewModel.ts
import { useEffect, useMemo, useState } from "react";
import { Contacto, Categoria } from "../../domain/entities/contact";
import { obtenerContactos } from "../../data/datasources/contactService";
import { contarPorMovimiento } from "../../data/datasources/historialService";
import { PuntoArea, EquipoDisponible } from "../components/StatisticsDashboard";

const TOP_AREAS = 8;

function normalizarCategoria(raw: unknown): Categoria | null {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "parlamento" || v === "diputado" || v === "senador" || v === "congresal")
    return v as Categoria;
  return null;
}

function esDisponible(contacto: Contacto): boolean {
  return contacto.estado === "INACTIVO";
}

function obtenerAreaSafe(contacto: Contacto): string {
  return String(contacto.area ?? "SIN ÁREA").toUpperCase().trim();
}

export function useStatisticsViewModel() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [eliminados, setEliminados] = useState<number>(0);
  const [cargando, setCargando] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria | null>(null);

  useEffect(() => {
    let isMounted = true;
    const cargarDatos = async () => {
      try {
        setCargando(true);
        const [listaContactos, countEliminados] = await Promise.all([
          obtenerContactos(),
          contarPorMovimiento("BAJA_PERSONA"),
        ]);
        if (isMounted) {
          setContactos(listaContactos);
          setEliminados(countEliminados);
        }
      } catch (error) {
        console.error("Error al obtener estadísticas:", error);
      } finally {
        if (isMounted) setCargando(false);
      }
    };
    cargarDatos();
    return () => { isMounted = false; };
  }, []);

  const contactosFiltrados = useMemo(() => {
    if (!categoriaFiltro) return contactos;
    return contactos.filter((c) => normalizarCategoria(c.categoria) === categoriaFiltro);
  }, [contactos, categoriaFiltro]);

  const disponibles = useMemo(
    () => contactosFiltrados.filter(esDisponible).length,
    [contactosFiltrados]
  );

  const equiposDisponiblesDetalle: EquipoDisponible[] = useMemo(
    () =>
      contactosFiltrados
        .filter(esDisponible)
        .map((c) => ({
          numero: String(c.telefono ?? ""),
          marca: String(c.marca ?? "").toUpperCase(),
          modelo: String(c.modelo ?? "").toUpperCase(),
          imei: String(c.serie ?? ""),
        })),
    [contactosFiltrados]
  );

  const datosArea: PuntoArea[] = useMemo(() => {
    const agrupado: Record<string, number> = {};
    for (const c of contactosFiltrados) {
      if (c.estado === "INACTIVO") continue;
      const area = obtenerAreaSafe(c);
      if (area === "DISPONIBLE" || area === "PENDIENTE") continue;
      agrupado[area] = (agrupado[area] || 0) + 1;
    }
    const listaOrdenada = Object.entries(agrupado)
      .map(([area, cantidad]) => ({ area, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    if (listaOrdenada.length <= TOP_AREAS) return listaOrdenada;

    const top = listaOrdenada.slice(0, TOP_AREAS);
    const resto = listaOrdenada.slice(TOP_AREAS);
    const totalOtros = resto.reduce((acc, x) => acc + x.cantidad, 0);
    return totalOtros > 0 ? [...top, { area: "OTROS", cantidad: totalOtros }] : top;
  }, [contactosFiltrados]);

  const areaConMasContactos = useMemo(
    () => datosArea.find((d) => d.area !== "OTROS")?.area ?? "Sin datos",
    [datosArea]
  );

  const cantidadActivos = useMemo(
    () => contactosFiltrados.filter((c) => c.estado !== "INACTIVO").length,
    [contactosFiltrados]
  );

  return {
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
  };
}
