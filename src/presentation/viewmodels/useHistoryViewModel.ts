// src/presentation/viewmodels/useHistoryViewModel.ts
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { ContactoConHistorial } from "../../domain/entities/contact";
import { obtenerHistorial } from "../../data/datasources/historialService";
import { formatoFechaDisplay } from "../../utils/dateUtils";

export function etiquetaCategoria(raw: unknown): string {
  const v = String(raw ?? "").toLowerCase().trim();
  if (v === "parlamento") return "Parlamento";
  if (v === "diputado") return "Diputado";
  if (v === "senador") return "Senador";
  if (v === "congresal") return "Congresal";
  return "Parlamento";
}

export function etiquetaMovimiento(raw: unknown): string {
  const v = String(raw ?? "").toUpperCase().trim();
  if (v === "BAJA_PERSONA") return "Baja de persona";
  if (v === "REACTIVACION") return "Reactivación";
  if (v === "ASIGNACION") return "Asignación";
  if (v === "ACTUALIZACION") return "Actualización";
  return v || "-";
}

export function useHistoryViewModel() {
  const [historial, setHistorial] = useState<ContactoConHistorial[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const cargarHistorial = async () => {
      try {
        const data = await obtenerHistorial();
        if (isMounted) setHistorial(data);
      } catch (error) {
        console.error("Error al obtener historial:", error);
      } finally {
        if (isMounted) setCargando(false);
      }
    };
    cargarHistorial();
    return () => { isMounted = false; };
  }, []);

  const historialLimpio = useMemo(() => {
    return historial
      .filter((c) => {
        const nombre = String(
          c.nombreCompleto ?? `${c.primerNombre ?? ""} ${c.primerApellido ?? ""}`
        ).toUpperCase().trim();
        return nombre !== "";
      })
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
      Nombre: (c.nombreCompleto || `${c.primerNombre ?? ""} ${c.primerApellido ?? ""}`).trim(),
      Teléfono: c.telefono,
      Área: c.area,
      Categoría: etiquetaCategoria(c.categoria),
      Marca: c.marca || "-",
      Modelo: c.modelo || "-",
      Serie: c.serie || "-",
      Movimiento: etiquetaMovimiento(c.tipoMovimiento),
      Estado: c.estado ?? "INACTIVO",
      "Fecha movimiento": formatoFechaDisplay(c.createdAt),
      Observación: c.observacion ?? "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataParaExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historial");
    XLSX.writeFile(workbook, "historial_contactos.xlsx");
  };

  return {
    cargando,
    historialLimpio,
    exportarHistorialAExcel,
    formatoFechaDisplay,
    etiquetaCategoria,
    etiquetaMovimiento,
  };
}
