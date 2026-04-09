// src/presentation/viewmodels/useDashboardViewModel.ts
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

import { Contacto, Categoria } from "../../domain/entities/contact";
import {
  obtenerContactos,
  agregarContacto,
  actualizarContacto,
  eliminarContacto,
  reactivarContacto,
  notificarImportacionResumen,
} from "../../data/datasources/contactService";
import { validarContacto } from "../../utils/formUtils";
import {
  exportarContactosVCF,
  exportarContactosCSV,
  exportarContactosExcel,
  descargarPlantillaContactos,
} from "../../utils/exportUtils";
import {
  isoToDDMMYYYY,
  ddmmyyyyToISO,
  obtenerFechaAtencionDDMMYYYY,
  parseFechaDDMMYYYY,
  esFechaFutura,
} from "../../utils/dateUtils";

function normalizarCategoria(raw: unknown): Categoria | null {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "parlamento" || v === "diputado" || v === "senador" || v === "congresal")
    return v as Categoria;
  return null;
}

const CONTACTO_VACIO: Contacto = {
  primerNombre: "",
  segundoNombre: "",
  primerApellido: "",
  segundoApellido: "",
  area: "",
  fechaAtencion: "",
  operador: "",
  telefono: "",
  marca: "",
  modelo: "",
  serie: "",
  nombreCompleto: "",
  categoria: "parlamento",
  estado: "ACTIVO",
};

export function useDashboardViewModel() {
  const navigate = useNavigate();

  // ── Estado principal ────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [allContacts, setAllContacts] = useState<Contacto[]>([]);
  const [baseContacts, setBaseContacts] = useState<Contacto[]>([]);

  // ── Filtros ─────────────────────────────────────────────────
  const [searchText, setSearchText] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<Categoria | null>(null);

  // ── Selección masiva ────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ── Modales ─────────────────────────────────────────────────
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── Confirmación ────────────────────────────────────────────
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("¿Confirmar?");
  const [confirmMessage, setConfirmMessage] = useState("");
  const confirmActionRef = useRef<() => void | Promise<void>>(() => {});

  // ── Overlays ─────────────────────────────────────────────────
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importMessage, setImportMessage] = useState("");

  // ── Formulario ───────────────────────────────────────────────
  const [formContact, setFormContact] = useState<Contacto>({ ...CONTACTO_VACIO });

  // ── Acciones rápidas ─────────────────────────────────────────
  const quickActions = [
    {
      label: "Agregar",
      img: "https://img.icons8.com/ios-filled/50/add-user-group-man-man.png",
      onClick: () => setIsAddModalOpen(true),
    },
    {
      label: "Importar",
      img: "https://img.icons8.com/ios-filled/50/import-csv.png",
      onClick: () => setIsImportModalOpen(true),
    },
    {
      label: "Exportar",
      img: "https://img.icons8.com/ios-filled/50/vcf.png",
      onClick: () => setIsExportModalOpen(true),
    },
    {
      label: "Dashboard",
      img: "https://img.icons8.com/ios-filled/50/combo-chart.png",
      onClick: () => navigate("/estadisticas"),
    },
    {
      label: "Historial de Contacto",
      img: "https://img.icons8.com/ios-filled/50/search-contacts.png",
      onClick: () => navigate("/historial"),
    },
    {
      label: "Perfil",
      img: "https://img.icons8.com/ios-filled/50/user.png",
      onClick: () => navigate("/perfil"),
    },
  ];

  // ── Carga y normalización desde Firestore ────────────────────
  const recargarContactosDesdeFirestore = async () => {
    const raw = await obtenerContactos();
    const lista: Contacto[] = raw.map((c) => ({
      ...c,
      telefono: String(c.telefono ?? ""),
      serie: String(c.serie ?? ""),
      categoria: normalizarCategoria((c as Partial<Contacto>).categoria) ?? "parlamento",
      estado: c.estado === "INACTIVO" ? "INACTIVO" : "ACTIVO",
    }));
    setAllContacts(lista);
  };

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true);
        await recargarContactosDesdeFirestore();
      } catch (error) {
        console.error("Error al cargar:", error);
        toast.error("Error al cargar datos.");
      } finally {
        setIsLoading(false);
      }
    };
    cargar();
  }, []);

  // ── Filtro estado + categoría ────────────────────────────────
  useEffect(() => {
    const filtradoPorEstado = allContacts.filter((c) =>
      showInactive ? true : c.estado !== "INACTIVO"
    );
    const filtradoFinal =
      categoryFilter === null
        ? filtradoPorEstado
        : filtradoPorEstado.filter((c) => c.categoria === categoryFilter);
    setBaseContacts(filtradoFinal);
  }, [allContacts, showInactive, categoryFilter]);

  // ── Filtro búsqueda ──────────────────────────────────────────
  const filteredContacts = baseContacts.filter((c) => {
    if (showInactive && c.estado !== "INACTIVO") return false;
    if (categoryFilter && c.categoria !== categoryFilter) return false;
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    const qDigits = q.replace(/\D+/g, "");
    const fullName = [c.primerNombre, c.segundoNombre, c.primerApellido, c.segundoApellido]
      .map((v) => String(v ?? ""))
      .join(" ").trim().toLowerCase();
    const telDigits = String(c.telefono ?? "").replace(/\D+/g, "");
    const serieStr = String(c.serie ?? "");
    return (
      fullName.includes(q) ||
      (qDigits !== "" && telDigits.includes(qDigits)) ||
      serieStr.toLowerCase().includes(q) ||
      (qDigits !== "" && serieStr.replace(/\D+/g, "").includes(qDigits))
    );
  });

  // ── Selección ────────────────────────────────────────────────
  const alternarSeleccion = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ── Editar ───────────────────────────────────────────────────
  const abrirEdicion = (contacto: Contacto) => {
    setIsEditing(true);
    setEditingId(contacto.id || null);
    const fa = String(contacto.fechaAtencion || "");
    const fechaISO = /^\d{2}\/\d{2}\/\d{4}$/.test(fa) ? ddmmyyyyToISO(fa) : fa;
    setFormContact({
      ...contacto,
      fechaAtencion: fechaISO,
      categoria: normalizarCategoria(contacto.categoria) ?? "parlamento",
      estado: contacto.estado === "INACTIVO" ? "INACTIVO" : "ACTIVO",
    });
    setIsFormOpen(true);
  };

  // ── Nuevo contacto ───────────────────────────────────────────
  const abrirFormularioNuevo = () => {
    setIsFormOpen(true);
    setIsEditing(false);
    setEditingId(null);
    setFormContact({ ...CONTACTO_VACIO });
  };

  // ── Reactivar ────────────────────────────────────────────────
  const solicitarReactivacion = async (id: string | undefined): Promise<void> => {
    if (!id) return;
    setConfirmTitle("¿Reactivar este contacto?");
    setConfirmMessage("Se reactivará este contacto.");
    confirmActionRef.current = async () => {
      try {
        await reactivarContacto(id);
        await recargarContactosDesdeFirestore();
        toast.success("✅ Contacto reactivado.");
      } catch (error) {
        console.error("Error al reactivar:", error);
        toast.error("Error al reactivar el contacto.");
      } finally {
        setConfirmOpen(false);
      }
    };
    setConfirmOpen(true);
  };

  // ── Eliminar uno ─────────────────────────────────────────────
  const solicitarEliminacion = async (id: string | undefined): Promise<void> => {
    if (!id) return;
    setConfirmTitle("¿Eliminar este contacto?");
    setConfirmMessage(
      "Se guardará en el historial y este número quedará como DISPONIBLE."
    );
    confirmActionRef.current = async () => {
      try {
        await eliminarContacto(id);
        setSelectedIds((prev) => prev.filter((x) => x !== id));
        await recargarContactosDesdeFirestore();
        toast.success("Guardado en el historial y marcado como disponible.");
      } catch (error) {
        console.error("Error al eliminar:", error);
        toast.error("Error al eliminar el contacto.");
      } finally {
        setConfirmOpen(false);
      }
    };
    setConfirmOpen(true);
  };

  // ── Eliminar masivo ──────────────────────────────────────────
  const solicitarEliminacionMasiva = () => {
    if (selectedIds.length === 0) { toast.warn("No has seleccionado ningún contacto."); return; }
    const idsActivos = selectedIds.filter((id) => {
      const c = allContacts.find((x) => x.id === id);
      return c?.estado !== "INACTIVO";
    });
    if (idsActivos.length === 0) { toast.info("Los contactos seleccionados ya están disponibles."); return; }
    setConfirmTitle("¿Eliminar contactos seleccionados?");
    setConfirmMessage(`Se guardarán en el historial y quedarán disponibles: ${idsActivos.length} contacto(s).`);
    confirmActionRef.current = async () => {
      setConfirmOpen(false);
      setIsDeleting(true);
      setDeleteProgress(0);
      try {
        const total = idsActivos.length;
        let done = 0;
        for (const id of idsActivos) {
          await eliminarContacto(id);
          done++;
          setDeleteProgress(Math.round((done / total) * 100));
        }
        setSelectedIds((prev) => prev.filter((x) => !idsActivos.includes(x)));
        await recargarContactosDesdeFirestore();
        toast.success("Eliminación completada.", { autoClose: 2000 });
      } catch (error) {
        console.error(error);
        toast.error("Error al eliminar seleccionados.", { autoClose: 4000 });
      } finally {
        setIsDeleting(false);
        setDeleteProgress(0);
      }
    };
    setConfirmOpen(true);
  };

  // ── Guardar (crear o actualizar) ─────────────────────────────
  const guardarContacto = async (): Promise<void> => {
    const error = validarContacto(formContact, allContacts, isEditing, editingId);
    if (error) { toast.error(error); return; }

    const fechaDDMM = isoToDDMMYYYY(formContact.fechaAtencion || "");
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fechaDDMM)) {
      toast.error("La fecha de atención debe estar en formato dd/mm/yyyy."); return;
    }
    if (!parseFechaDDMMYYYY(fechaDDMM)) {
      toast.error("La fecha de atención no es válida."); return;
    }
    if (esFechaFutura(fechaDDMM)) {
      toast.error("La fecha de atención no puede ser mayor a la fecha actual."); return;
    }

    const telefonoDigits = String(formContact.telefono ?? "").replace(/\D+/g, "");
    if (!/^\d{9}$/.test(telefonoDigits)) {
      toast.error("El teléfono debe contener exactamente 9 dígitos."); return;
    }

    const serieDigits = String(formContact.serie ?? "").replace(/\D+/g, "");
    if (!/^\d{15}$/.test(serieDigits)) {
      toast.error("El IMEI / Serie debe contener exactamente 15 dígitos."); return;
    }

    const categoriaOk = normalizarCategoria(formContact.categoria);
    if (!categoriaOk) {
      toast.error("La categoría debe ser: parlamento, diputado, senador o congresal."); return;
    }

    const payload: Contacto = {
      id: editingId ?? undefined,
      primerNombre: formContact.primerNombre?.toUpperCase() || "",
      segundoNombre: formContact.segundoNombre?.toUpperCase() || "",
      primerApellido: formContact.primerApellido?.toUpperCase() || "",
      segundoApellido: formContact.segundoApellido?.toUpperCase() || "",
      area: formContact.area?.toUpperCase() || "",
      fechaAtencion: fechaDDMM,
      operador: formContact.operador?.toUpperCase() || "",
      telefono: telefonoDigits,
      marca: formContact.marca?.toUpperCase() || "",
      modelo: formContact.modelo?.toUpperCase() || "",
      serie: serieDigits,
      nombreCompleto: `${formContact.primerNombre || ""} ${formContact.segundoNombre || ""} ${formContact.primerApellido || ""} ${formContact.segundoApellido || ""}`.toUpperCase().trim(),
      categoria: categoriaOk,
      estado: isEditing ? (formContact.estado === "INACTIVO" ? "INACTIVO" : "ACTIVO") : "ACTIVO",
      createdAt: isEditing
        ? formContact.createdAt ?? new Date().toISOString()
        : new Date().toISOString(),
    };

    try {
      if (isEditing && editingId) {
        await actualizarContacto(editingId, payload);
        await recargarContactosDesdeFirestore();
        toast.success("Contacto actualizado y registrado en historial.");
      } else {
        await agregarContacto(payload);
        await recargarContactosDesdeFirestore();
        toast.success("Contacto agregado exitosamente.");
      }
      setIsFormOpen(false);
      setIsEditing(false);
      setEditingId(null);
    } catch (err) {
      console.error("Error al guardar:", err);
      toast.error("Ocurrió un error al guardar el contacto.");
    }
  };

  // ── Importación masiva ───────────────────────────────────────
  const importarContactosDesdeArchivo = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt: ProgressEvent<FileReader>) => {
      const data = evt.target?.result;
      if (!data) return;
      try {
        setIsImporting(true);
        setImportProgress(0);
        setImportMessage("Leyendo archivo...");

        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        if (!rows.length) { toast.warn("El archivo no contiene registros para importar."); return; }

        const telefonosExistentes = new Set(allContacts.map((c) => String(c.telefono ?? "").replace(/\D+/g, "")));
        const seriesExistentes = new Set(allContacts.map((c) => String(c.serie ?? "").replace(/\D+/g, "")));
        const telefonosVistos = new Set<string>();
        const seriesVistas = new Set<string>();

        let insertados = 0, rechazados = 0, dupTelefono = 0, dupSerie = 0, invalidos = 0, categoriaInvalida = 0, fechaFutura = 0;
        const duplicadosTelefono: string[] = [];
        const duplicadosSerie: string[] = [];
        const invalidosDet: { fila: number; motivo: string; telefono?: string; serie?: string }[] = [];
        const categoriaInvalidaDet: { fila: number; valor: string }[] = [];
        const fechaFuturaDet: { fila: number; fecha: string; telefono?: string; serie?: string }[] = [];
        const MAX_DETALLE = 50;
        const pushLimit = <T,>(arr: T[], item: T) => { if (arr.length < MAX_DETALLE) arr.push(item); };

        const total = rows.length;
        const toastId = toast.loading("Importando contactos... 0%");

        for (let i = 0; i < total; i++) {
          const row = rows[i];
          const pct = Math.round(((i + 1) / total) * 100);
          setImportProgress(pct);
          setImportMessage(`Procesando ${i + 1} de ${total}...`);
          toast.update(toastId, { render: `Importando contactos... ${pct}%`, isLoading: true });

          const categoriaExcel = normalizarCategoria(row["categoria"]);
          if (!categoriaExcel) {
            rechazados++; categoriaInvalida++;
            pushLimit(categoriaInvalidaDet, { fila: i + 2, valor: String(row["categoria"] ?? "") });
            continue;
          }

          const { primerNombre, segundoNombre, primerApellido, segundoApellido, area, fechaAtencion: fechaAtencionRaw, operador, telefono, marca, modelo, serie } = row as Record<string, unknown>;

          if (!primerNombre || !primerApellido || !area || !fechaAtencionRaw || !operador || !telefono || !marca || !modelo || !serie) {
            rechazados++; invalidos++;
            pushLimit(invalidosDet, { fila: i + 2, motivo: "Campos obligatorios incompletos", telefono: String(telefono ?? ""), serie: String(serie ?? "") });
            continue;
          }

          const telefonoDigits = String(telefono ?? "").replace(/\D+/g, "");
          const serieDigits = String(serie ?? "").replace(/\D+/g, "");

          if (!/^\d{9}$/.test(telefonoDigits) || !/^\d{15}$/.test(serieDigits)) {
            rechazados++; invalidos++;
            pushLimit(invalidosDet, { fila: i + 2, motivo: "Formato inválido (teléfono 9 dígitos / IMEI 15 dígitos)", telefono: telefonoDigits, serie: serieDigits });
            continue;
          }

          if (telefonosExistentes.has(telefonoDigits) || telefonosVistos.has(telefonoDigits)) {
            rechazados++; dupTelefono++;
            pushLimit(duplicadosTelefono, telefonoDigits);
            continue;
          }

          if (seriesExistentes.has(serieDigits) || seriesVistas.has(serieDigits)) {
            rechazados++; dupSerie++;
            pushLimit(duplicadosSerie, serieDigits);
            continue;
          }

          const fechaDDMM = obtenerFechaAtencionDDMMYYYY(fechaAtencionRaw);
          if (!parseFechaDDMMYYYY(fechaDDMM)) {
            rechazados++; invalidos++;
            pushLimit(invalidosDet, { fila: i + 2, motivo: "Fecha inválida", telefono: telefonoDigits, serie: serieDigits });
            continue;
          }
          if (esFechaFutura(fechaDDMM)) {
            rechazados++; fechaFutura++;
            pushLimit(fechaFuturaDet, { fila: i + 2, fecha: fechaDDMM, telefono: telefonoDigits, serie: serieDigits });
            continue;
          }

          telefonosVistos.add(telefonoDigits);
          seriesVistas.add(serieDigits);

          const contacto: Contacto = {
            primerNombre: String(primerNombre).toUpperCase(),
            segundoNombre: String(segundoNombre ?? "").toUpperCase(),
            primerApellido: String(primerApellido).toUpperCase(),
            segundoApellido: String(segundoApellido ?? "").toUpperCase(),
            area: String(area).toUpperCase(),
            fechaAtencion: fechaDDMM,
            operador: String(operador).toUpperCase(),
            telefono: telefonoDigits,
            marca: String(marca).toUpperCase(),
            modelo: String(modelo).toUpperCase(),
            serie: serieDigits,
            nombreCompleto: `${String(primerNombre)} ${String(segundoNombre ?? "")} ${String(primerApellido)} ${String(segundoApellido ?? "")}`.trim().toUpperCase(),
            categoria: categoriaExcel,
            createdAt: new Date().toISOString(),
            estado: "ACTIVO",
          };

          await agregarContacto(contacto, { notificar: false, origen: "IMPORTACION" });
          telefonosExistentes.add(telefonoDigits);
          seriesExistentes.add(serieDigits);
          insertados++;
        }

        await notificarImportacionResumen({
          resumen: { total, insertados, rechazados, dupTelefono, dupSerie, invalidos, categoriaInvalida, fechaFutura },
          detalle: { duplicadosTelefono, duplicadosSerie, invalidos: invalidosDet, categoriaInvalida: categoriaInvalidaDet, fechaFutura: fechaFuturaDet },
        });

        toast.update(toastId, {
          render: `✅ Importación finalizada. Importados: ${insertados}`,
          type: insertados > 0 ? "success" : "info",
          isLoading: false,
          autoClose: 3000,
        });

        if (rechazados > 0) {
          toast.info(`⚠️ Rechazados: ${rechazados} | Dup Tel: ${dupTelefono} | Dup IMEI: ${dupSerie} | Inválidos: ${invalidos} | Cat. inválida: ${categoriaInvalida} | Fecha futura: ${fechaFutura}`, { autoClose: 6000 });
        }
        if (insertados === 0) toast.warn("No se importó ningún contacto válido.");

        await recargarContactosDesdeFirestore();
        setIsImportModalOpen(false);
      } catch (error) {
        console.error("Error al importar:", error);
        toast.error("Ocurrió un error durante la importación.");
      } finally {
        setImportMessage("Finalizando...");
        setImportProgress(100);
        setTimeout(() => { setIsImporting(false); setImportProgress(0); setImportMessage(""); }, 300);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const abrirSelectorArchivoImportacion = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls,.csv";
    input.onchange = (ev) => importarContactosDesdeArchivo(ev as unknown as Event);
    input.click();
  };

  // ── Scanner VIISAN ───────────────────────────────────────────
  const SCANNER_URI = "viisan://scan";
  const abrirScannerViisan = () => {
    toast.info("🔄 Intentando abrir VIISAN OfficeCam...", { autoClose: 3000 });
    try {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = SCANNER_URI;
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 2000);
      setTimeout(() => { window.location.href = SCANNER_URI; }, 100);
    } catch (err) {
      console.error("Error al abrir VIISAN:", err);
      toast.error("⚠️ No se pudo lanzar VIISAN (revisa instalación)", { autoClose: 5000 });
    }
  };

  // ── Exportación ──────────────────────────────────────────────
  const getContactosParaExportar = () =>
    selectedIds.length > 0
      ? filteredContacts.filter((c) => selectedIds.includes(c.id || ""))
      : filteredContacts;

  const handleExportVCF = () => exportarContactosVCF(getContactosParaExportar());
  const handleExportCSV = () => exportarContactosCSV(getContactosParaExportar());
  const handleExportExcel = () => exportarContactosExcel(getContactosParaExportar());
  const handleDescargarPlantilla = () => {
    descargarPlantillaContactos();
    toast.success("✅ Plantilla descargada");
  };

  // ── Cambio de formulario ─────────────────────────────────────
  const manejarCambioFormulario = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormContact((prev) => {
      if (name === "serie") return { ...prev, serie: String(value).replace(/\D+/g, "").slice(0, 15) };
      if (name === "telefono") return { ...prev, telefono: String(value).replace(/\D+/g, "").slice(0, 9) };
      if (name === "fechaAtencion") return { ...prev, fechaAtencion: String(value) };
      if (name === "categoria") {
        const cat = normalizarCategoria(value);
        return cat ? { ...prev, categoria: cat } : prev;
      }
      return { ...prev, [name]: String(value).toUpperCase() };
    });
  };

  // ── Exponer al ViewModel ─────────────────────────────────────
  return {
    // Estado
    isLoading,
    filteredContacts,
    selectedIds,
    searchText, setSearchText,
    showInactive, setShowInactive,
    categoryFilter, setCategoryFilter,
    // Modales
    isExportModalOpen, setIsExportModalOpen,
    isImportModalOpen, setIsImportModalOpen,
    isAddModalOpen, setIsAddModalOpen,
    isFormOpen, setIsFormOpen,
    isEditing,
    formContact,
    // Confirmación
    confirmOpen, setConfirmOpen,
    confirmTitle,
    confirmMessage,
    handleConfirm: () => confirmActionRef.current(),
    // Overlays
    isDeleting, deleteProgress,
    isImporting, importProgress, importMessage,
    // Acciones
    quickActions,
    alternarSeleccion,
    abrirEdicion,
    abrirFormularioNuevo,
    solicitarEliminacion,
    solicitarReactivacion,
    solicitarEliminacionMasiva,
    guardarContacto,
    manejarCambioFormulario,
    abrirSelectorArchivoImportacion,
    abrirScannerViisan,
    handleExportVCF,
    handleExportCSV,
    handleExportExcel,
    handleDescargarPlantilla,
  };
}
