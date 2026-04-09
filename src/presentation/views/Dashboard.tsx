// src/presentation/views/Dashboard.tsx

/**
 * ============================================================
 * DASHBOARD - Gestión de Contactos
 * ------------------------------------------------------------
 * Esta pantalla hace:
 * 1) Carga contactos desde Firestore
 * 2) Filtra por categoría y por estado (ACTIVO / INACTIVO)
 * 3) Permite buscar por nombre, teléfono o serie
 * 4) CRUD: Agregar, Editar, Eliminar (marcar DISPONIBLE) y Reactivar
 * 5) Importación masiva desde Excel/CSV (XLSX)
 * 6) Exportación (VCF/CSV/Excel)
 *
 * NOTA IMPORTANTE:
 * - El historial NO se registra aquí. Se registra en contactService.ts
 * ============================================================
 */

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import * as XLSX from "xlsx";

/** Componentes UI */
import ContactTable from "../components/ContactTable";
import ExportModal from "../components/ExportModal";
import ContactModalForm from "../components/ContactModalForm";
import QuickActions from "../components/QuickActions";
import DeletingOverlay from "../components/DeletingOverlay";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

/** Tipos del dominio */
import { Contacto, Categoria } from "../../domain/entities/contact";

/** Servicios (Firestore) */
import {
  obtenerContactos,
  agregarContacto,
  actualizarContacto,
  eliminarContacto,
  reactivarContacto,
  notificarImportacionResumen, // ✅ 1 correo resumen al finalizar
} from "../../data/datasources/contactService";

/** Utilidades */
import {
  exportarContactosVCF,
  exportarContactosCSV,
  exportarContactosExcel,
  descargarPlantillaContactos,
} from "../../utils/exportUtils";
import { validarContacto } from "../../utils/formUtils";

/** Estilos/Assets */
import cargandoLogo from "../../assets/img/cargando.webp";
import "../../index.css";
import "react-toastify/dist/ReactToastify.css";

/* ============================================================
   BLOQUE A: Helpers de fechas
   ============================================================ */

/** yyyy-mm-dd -> dd/mm/yyyy */
function isoToDDMMYYYY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || "").trim());
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** dd/mm/yyyy -> yyyy-mm-dd */
function ddmmyyyyToISO(ddmmyyyy: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(ddmmyyyy || "").trim());
  if (!m) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Excel serial number -> dd/mm/yyyy */
function convertirFechaExcel(fechaSerial: number): string {
  const fecha = new Date(Math.round((fechaSerial - 25569) * 86400 * 1000));
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

/** Acepta solo estas categorías */
function normalizarCategoria(raw: unknown): Categoria | null {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "parlamento" || v === "diputado" || v === "senador" || v === "congresal") {
    return v as Categoria;
  }
  return null;
}

/** Convierte cualquier formato de fecha (excel/string) a dd/mm/yyyy */
function obtenerFechaAtencionDDMMYYYY(raw: unknown): string {
  if (typeof raw === "number") return convertirFechaExcel(raw);

  if (typeof raw === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;

  if (typeof raw === "string" && !isNaN(Date.parse(raw))) {
    const fecha = new Date(raw);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  return "01/01/1900";
}

/** dd/mm/yyyy -> Date (si es inválida devuelve null) */
function parseFechaDDMMYYYY(fecha: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(fecha || "").trim());
  if (!m) return null;

  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);

  const d = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd)
    return null;

  return d;
}

/** Regla: no permitir fecha futura */
function esFechaFutura(fechaDDMMYYYY: string): boolean {
  const d = parseFechaDDMMYYYY(fechaDDMMYYYY);
  if (!d) return true;

  const hoy = new Date();
  const hoySinHora = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
    12,
    0,
    0,
    0
  );
  return d.getTime() > hoySinHora.getTime();
}

/* ============================================================
   BLOQUE B: Overlay de importación (UI)
   ============================================================ */
function ImportingOverlay({
  open,
  progress,
  message,
}: {
  open: boolean;
  progress: number;
  message: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-[61] w-[92%] max-w-md rounded-2xl bg-white shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 text-center">
          Importando contactos
        </h3>
        <p className="mt-2 text-sm text-gray-600 text-center">{message}</p>

        <div className="mt-4 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-red-600 h-3 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-2 text-sm text-gray-700 text-center font-semibold">
          {progress}%
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  /* ============================================================
     BLOQUE 1: Estados principales (UI + datos)
     ============================================================ */

  /** Carga inicial */
  const [isLoading, setIsLoading] = useState(true);

  /** Contactos */
  const [allContacts, setAllContacts] = useState<Contacto[]>([]);
  const [baseContacts, setBaseContacts] = useState<Contacto[]>([]);

  /** Búsqueda y filtros */
  const [searchText, setSearchText] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<Categoria | null>(null);

  /** Selección masiva */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  /** Modales */
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  /** Modal formulario (agregar/editar) */
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  /** Confirmación genérica */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("¿Confirmar?");
  const [confirmMessage, setConfirmMessage] = useState("");
  const confirmActionRef = useRef<() => void | Promise<void>>(() => {});

  /** Overlay eliminado masivo */
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);

  /** Overlay importación */
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importMessage, setImportMessage] = useState("");

  /** Formulario */
  const [formContact, setFormContact] = useState<Contacto>({
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
  });

  const navigate = useNavigate();

  /* ============================================================
     BLOQUE 2: Acciones rápidas (botones superiores)
     ============================================================ */
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

  /* ============================================================
     BLOQUE 3: Función clave - Recargar contactos desde Firestore
     ============================================================ */
  const recargarContactosDesdeFirestore = async () => {
    const raw = await obtenerContactos();

    const lista: Contacto[] = raw.map((c) => {
      const categoria =
        normalizarCategoria((c as Partial<Contacto>).categoria) ?? "parlamento";
      const estado = c.estado === "INACTIVO" ? "INACTIVO" : "ACTIVO";

      return {
        ...c,
        telefono: String(c.telefono ?? ""),
        serie: String(c.serie ?? ""),
        categoria,
        estado,
      };
    });

    setAllContacts(lista);
  };

  /* ============================================================
     BLOQUE 4: Carga inicial
     ============================================================ */
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

  /* ============================================================
     BLOQUE 5: Aplicar filtros base (estado + categoría)
     ============================================================ */
  useEffect(() => {
    const filtradoPorEstado = allContacts.filter((c) => {
      const esInactivo = c.estado === "INACTIVO";
      return showInactive ? true : !esInactivo;
    });

    const filtradoFinal =
      categoryFilter === null
        ? filtradoPorEstado
        : filtradoPorEstado.filter((c) => c.categoria === categoryFilter);

    setBaseContacts(filtradoFinal);
  }, [allContacts, showInactive, categoryFilter]);

  /* ============================================================
     BLOQUE 6: Importación desde archivo (Excel/CSV)
     - ✅ NO envía correo por contacto
     - ✅ Envía 1 solo resumen al final
     ============================================================ */
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

        if (!rows.length) {
          toast.warn("El archivo no contiene registros para importar.");
          return;
        }

        const telefonosExistentes = new Set(
          allContacts.map((c) => String(c.telefono ?? "").replace(/\D+/g, ""))
        );
        const seriesExistentes = new Set(
          allContacts.map((c) => String(c.serie ?? "").replace(/\D+/g, ""))
        );

        const telefonosVistos = new Set<string>();
        const seriesVistas = new Set<string>();

        let insertados = 0;
        let rechazados = 0;
        let dupTelefono = 0;
        let dupSerie = 0;
        let invalidos = 0;
        let categoriaInvalida = 0;
        let fechaFutura = 0;

        // ✅ Detalle de errores (para el correo único)
        const duplicadosTelefono: string[] = [];
        const duplicadosSerie: string[] = [];
        const invalidosDet: {
          fila: number;
          motivo: string;
          telefono?: string;
          serie?: string;
        }[] = [];
        const categoriaInvalidaDet: { fila: number; valor: string }[] = [];
        const fechaFuturaDet: {
          fila: number;
          fecha: string;
          telefono?: string;
          serie?: string;
        }[] = [];

        // límite para que el correo no sea gigante
        const MAX_DETALLE = 50;
        const pushLimit = <T,>(arr: T[], item: T) => {
          if (arr.length < MAX_DETALLE) arr.push(item);
        };

        const total = rows.length;
        const toastId = toast.loading("Importando contactos... 0%");

        for (let i = 0; i < total; i++) {
          const row = rows[i];

          const pct = Math.round(((i + 1) / total) * 100);
          setImportProgress(pct);
          setImportMessage(`Procesando ${i + 1} de ${total}...`);
          toast.update(toastId, {
            render: `Importando contactos... ${pct}%`,
            isLoading: true,
          });

          const categoriaExcel = normalizarCategoria(row["categoria"]);
          if (!categoriaExcel) {
            rechazados++;
            categoriaInvalida++;
            pushLimit(categoriaInvalidaDet, {
              fila: i + 2,
              valor: String(row["categoria"] ?? ""),
            });
            continue;
          }

          const primerNombre = row["primerNombre"];
          const segundoNombre = row["segundoNombre"];
          const primerApellido = row["primerApellido"];
          const segundoApellido = row["segundoApellido"];
          const area = row["area"];
          const fechaAtencionRaw = row["fechaAtencion"];
          const operador = row["operador"];
          const telefono = row["telefono"];
          const marca = row["marca"];
          const modelo = row["modelo"];
          const serie = row["serie"];

          // Campos obligatorios
          if (
            !primerNombre ||
            !primerApellido ||
            !area ||
            !fechaAtencionRaw ||
            !operador ||
            !telefono ||
            !marca ||
            !modelo ||
            !serie
          ) {
            rechazados++;
            invalidos++;
            pushLimit(invalidosDet, {
              fila: i + 2,
              motivo: "Campos obligatorios incompletos",
              telefono: String(telefono ?? ""),
              serie: String(serie ?? ""),
            });
            continue;
          }

          const telefonoDigits = String(telefono ?? "").replace(/\D+/g, "");
          const serieDigits = String(serie ?? "").replace(/\D+/g, "");

          if (!/^\d{9}$/.test(telefonoDigits) || !/^\d{15}$/.test(serieDigits)) {
            rechazados++;
            invalidos++;
            pushLimit(invalidosDet, {
              fila: i + 2,
              motivo: "Formato inválido (teléfono 9 dígitos / IMEI 15 dígitos)",
              telefono: telefonoDigits,
              serie: serieDigits,
            });
            continue;
          }

          if (
            telefonosExistentes.has(telefonoDigits) ||
            telefonosVistos.has(telefonoDigits)
          ) {
            rechazados++;
            dupTelefono++;
            pushLimit(duplicadosTelefono, telefonoDigits);
            continue;
          }

          if (seriesExistentes.has(serieDigits) || seriesVistas.has(serieDigits)) {
            rechazados++;
            dupSerie++;
            pushLimit(duplicadosSerie, serieDigits);
            continue;
          }

          const fechaDDMM = obtenerFechaAtencionDDMMYYYY(fechaAtencionRaw);
          const fechaOk = parseFechaDDMMYYYY(fechaDDMM);

          if (!fechaOk) {
            rechazados++;
            invalidos++;
            pushLimit(invalidosDet, {
              fila: i + 2,
              motivo: "Fecha inválida",
              telefono: telefonoDigits,
              serie: serieDigits,
            });
            continue;
          }

          if (esFechaFutura(fechaDDMM)) {
            rechazados++;
            fechaFutura++;
            pushLimit(fechaFuturaDet, {
              fila: i + 2,
              fecha: fechaDDMM,
              telefono: telefonoDigits,
              serie: serieDigits,
            });
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
            nombreCompleto: `${String(primerNombre)} ${String(
              segundoNombre ?? ""
            )} ${String(primerApellido)} ${String(segundoApellido ?? "")}`
              .trim()
              .toUpperCase(),
            categoria: categoriaExcel,
            createdAt: new Date().toISOString(),
            estado: "ACTIVO",
          };

          // ✅ IMPORTA SIN NOTIFICAR por contacto
          await agregarContacto(contacto, { notificar: false, origen: "IMPORTACION" });

          telefonosExistentes.add(telefonoDigits);
          seriesExistentes.add(serieDigits);

          insertados++;
        }

        // ✅ 1 SOLO webhook con resumen + detalle
        const resumen = {
          total,
          insertados,
          rechazados,
          dupTelefono,
          dupSerie,
          invalidos,
          categoriaInvalida,
          fechaFutura,
        };

        const detalle = {
          duplicadosTelefono,
          duplicadosSerie,
          invalidos: invalidosDet,
          categoriaInvalida: categoriaInvalidaDet,
          fechaFutura: fechaFuturaDet,
        };

        await notificarImportacionResumen({ resumen, detalle });

        toast.update(toastId, {
          render: `✅ Importación finalizada. Importados: ${insertados}`,
          type: insertados > 0 ? "success" : "info",
          isLoading: false,
          autoClose: 3000,
        });

        if (rechazados > 0) {
          toast.info(
            `⚠️ Rechazados: ${rechazados} | Duplicados Tel: ${dupTelefono} | Duplicados IMEI/Serie: ${dupSerie} | Inválidos: ${invalidos} | Categoría inválida: ${categoriaInvalida} | Fecha futura: ${fechaFutura}`,
            { autoClose: 6000 }
          );
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
        setTimeout(() => {
          setIsImporting(false);
          setImportProgress(0);
          setImportMessage("");
        }, 300);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  /** Abre el selector de archivo Excel/CSV */
  const abrirSelectorArchivoImportacion = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls,.csv";
    input.onchange = (ev) => importarContactosDesdeArchivo(ev as unknown as Event);
    input.click();
  };

  /* ============================================================
     BLOQUE 7: Selección masiva (checkbox)
     ============================================================ */
  const alternarSeleccion = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ============================================================
     BLOQUE 8: Contactos filtrados por estado + categoría + búsqueda
     ============================================================ */
  const filteredContacts = baseContacts.filter((c) => {
    if (showInactive && c.estado !== "INACTIVO") return false;
    if (categoryFilter && c.categoria !== categoryFilter) return false;

    const q = searchText.trim().toLowerCase();
    if (!q) return true;

    const qDigits = q.replace(/\D+/g, "");

    const fullName = [
      c.primerNombre,
      c.segundoNombre,
      c.primerApellido,
      c.segundoApellido,
    ]
      .map((v) => String(v ?? ""))
      .join(" ")
      .trim()
      .toLowerCase();

    const telDigits = String(c.telefono ?? "").replace(/\D+/g, "");
    const serieStr = String(c.serie ?? "");
    const serieLower = serieStr.toLowerCase();
    const serieDigits = serieStr.replace(/\D+/g, "");

    return (
      fullName.includes(q) ||
      (qDigits !== "" && telDigits.includes(qDigits)) ||
      serieLower.includes(q) ||
      (qDigits !== "" && serieDigits.includes(qDigits))
    );
  });

  /* ============================================================
     BLOQUE 9: Editar contacto (abre formulario precargado)
     ============================================================ */
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

  /* ============================================================
     BLOQUE 10: Reactivar (confirmación)
     ============================================================ */
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

  /* ============================================================
     BLOQUE 11: Eliminar 1 (confirmación)
     ============================================================ */
  const solicitarEliminacion = async (id: string | undefined): Promise<void> => {
    if (!id) return;

    setConfirmTitle("¿Eliminar este contacto?");
    setConfirmMessage(
      "Se guardará en el historial y este número quedará como DISPONIBLE (teléfono/equipo se mantienen)."
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

  /* ============================================================
     BLOQUE 12: Eliminar seleccionados (masivo con progreso)
     ============================================================ */
  const solicitarEliminacionMasiva = () => {
    if (selectedIds.length === 0) {
      toast.warn("No has seleccionado ningún contacto.");
      return;
    }

    const idsActivos = selectedIds.filter((id) => {
      const c = allContacts.find((x) => x.id === id);
      return c?.estado !== "INACTIVO";
    });

    if (idsActivos.length === 0) {
      toast.info("Los contactos seleccionados ya están disponibles.");
      return;
    }

    setConfirmTitle("¿Eliminar contactos seleccionados?");
    setConfirmMessage(
      `Se guardarán en el historial y quedarán disponibles: ${idsActivos.length} contacto(s).`
    );

    confirmActionRef.current = async () => {
      await eliminarSeleccionadosConfirmado(idsActivos);
    };

    setConfirmOpen(true);
  };

  const eliminarSeleccionadosConfirmado = async (ids: string[]): Promise<void> => {
    if (!ids.length) return;

    setConfirmOpen(false);
    setIsDeleting(true);
    setDeleteProgress(0);

    try {
      const total = ids.length;
      let done = 0;

      for (const id of ids) {
        await eliminarContacto(id);
        done++;
        const pct = Math.round((done / total) * 100);
        setDeleteProgress(pct);
      }

      setSelectedIds((prev) => prev.filter((x) => !ids.includes(x)));
      await recargarContactosDesdeFirestore();

      toast.success("Eliminación completada. Los contactos quedaron disponibles.", {
        autoClose: 2000,
      });
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar seleccionados.", { autoClose: 4000 });
    } finally {
      setIsDeleting(false);
      setDeleteProgress(0);
    }
  };

  /* ============================================================
     BLOQUE 13: Abrir formulario manual (nuevo contacto)
     ============================================================ */
  const abrirFormularioNuevo = () => {
    setIsFormOpen(true);
    setIsEditing(false);
    setEditingId(null);

    setFormContact({
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
    });
  };

  /* ============================================================
     BLOQUE 14: Abrir VIISAN (Scanner)
     ============================================================ */
  const SCANNER_URI = "viisan://scan";

  const abrirScannerViisan = () => {
    toast.info("🔄 Intentando abrir VIISAN OfficeCam...", { autoClose: 3000 });

    try {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = SCANNER_URI;
      document.body.appendChild(iframe);

      setTimeout(() => document.body.removeChild(iframe), 2000);

      setTimeout(() => {
        window.location.href = SCANNER_URI;
      }, 100);
    } catch (err) {
      console.error("Error al abrir VIISAN:", err);
      toast.error("⚠️ No se pudo lanzar VIISAN (revisa instalación)", {
        autoClose: 5000,
      });
    }
  };

  /* ============================================================
     BLOQUE 15: Guardar (crear o actualizar)
     ============================================================ */
  const guardarContacto = async (): Promise<void> => {
    const error = validarContacto(formContact, allContacts, isEditing, editingId);
    if (error) {
      toast.error(error);
      return;
    }

    const fechaDDMM = isoToDDMMYYYY(formContact.fechaAtencion || "");
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fechaDDMM)) {
      toast.error("La fecha de atención debe estar en formato dd/mm/yyyy.");
      return;
    }

    const parsed = parseFechaDDMMYYYY(fechaDDMM);
    if (!parsed) {
      toast.error("La fecha de atención no es válida.");
      return;
    }
    if (esFechaFutura(fechaDDMM)) {
      toast.error("La fecha de atención no puede ser mayor a la fecha actual.");
      return;
    }

    const telefonoDigits = String(formContact.telefono ?? "").replace(/\D+/g, "");
    if (!/^\d{9}$/.test(telefonoDigits)) {
      toast.error("El teléfono debe contener exactamente 9 dígitos numéricos.");
      return;
    }

    const serieDigits = String(formContact.serie ?? "").replace(/\D+/g, "");
    if (!/^\d{15}$/.test(serieDigits)) {
      toast.error("El IMEI / Serie debe contener exactamente 15 dígitos numéricos.");
      return;
    }

    const categoriaOk = normalizarCategoria(formContact.categoria);
    if (!categoriaOk) {
      toast.error("La categoría debe ser: parlamento, diputado o senador.");
      return;
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
      nombreCompleto: `${formContact.primerNombre || ""} ${formContact.segundoNombre || ""} ${
        formContact.primerApellido || ""
      } ${formContact.segundoApellido || ""}`
        .toUpperCase()
        .trim(),
      categoria: categoriaOk,
      estado: isEditing ? (formContact.estado === "INACTIVO" ? "INACTIVO" : "ACTIVO") : "ACTIVO",
      createdAt: isEditing ? formContact.createdAt ?? new Date().toISOString() : new Date().toISOString(),
    };

    try {
      if (isEditing && editingId) {
        await actualizarContacto(editingId, payload);
        await recargarContactosDesdeFirestore();
        toast.success("Contacto actualizado y registrado en historial.");
      } else {
        await agregarContacto(payload); // ✅ alta manual notifica normal
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

  /* ============================================================
     BLOQUE 16: Render de carga
     ============================================================ */
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <img src={cargandoLogo} alt="Logo" className="w-24 h-24 animate-pulse mb-4" />
        <span className="text-gray-600 text-lg animate-pulse font-semibold">
          Cargando contactos...
        </span>
      </div>
    );
  }

  /* ============================================================
     BLOQUE 17: Render principal
     ============================================================ */
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <main className="w-full p-2">
        <ToastContainer position="top-center" autoClose={3000} />

        <ImportingOverlay open={isImporting} progress={importProgress} message={importMessage} />

        <h2 className="text-3xl font-bold text-center text-slate-600 mb-6">
          Gestión de Contactos
        </h2>

        <QuickActions actions={quickActions} />

        {/* =========================
           MODAL IMPORTAR
           ========================= */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsImportModalOpen(false)} />
            <div className="relative z-10 w-[92%] max-w-md rounded-2xl bg-white shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 text-center">
                Importar contactos
              </h2>
              <p className="mt-2 text-sm text-gray-600 text-center">
                Puedes descargar la plantilla. La columna <b>categoria</b> debe ser <b>parlamento</b>,{" "}
                <b>diputado</b> o <b>senador</b>.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <button
                  onClick={abrirSelectorArchivoImportacion}
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 hover:bg-gray-50 active:scale-[0.99] transition"
                >
                  📥 Importar archivo
                </button>

                <button
                  onClick={() => {
                    descargarPlantillaContactos();
                    toast.success("✅ Plantilla descargada");
                  }}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-slate-700 text-white px-4 py-3 hover:bg-slate-800 active:scale-[0.99] transition"
                >
                  ⬇️ Descargar plantilla
                </button>
              </div>

              <button
                onClick={() => setIsImportModalOpen(false)}
                className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* =========================
           FORMULARIO (AGREGAR/EDITAR)
           ========================= */}
        {isFormOpen && (
          <ContactModalForm
            contacto={formContact}
            modoEdicion={isEditing}
            manejarCambio={(e) => {
              const { name, value } = e.target;

              setFormContact((prev) => {
                if (name === "serie") {
                  const digits = String(value).replace(/\D+/g, "").slice(0, 15);
                  return { ...prev, serie: digits };
                }

                if (name === "telefono") {
                  const digits = String(value).replace(/\D+/g, "").slice(0, 9);
                  return { ...prev, telefono: digits };
                }

                if (name === "fechaAtencion") {
                  return { ...prev, fechaAtencion: String(value) };
                }

                if (name === "categoria") {
                  const cat = normalizarCategoria(value);
                  return cat ? { ...prev, categoria: cat } : prev;
                }

                return { ...prev, [name]: String(value).toUpperCase() };
              });
            }}
            manejarSubmit={guardarContacto}
            onClose={() => setIsFormOpen(false)}
          />
        )}

        {/* =========================
           MODAL EXPORTAR
           ========================= */}
        {isExportModalOpen && (
          <ExportModal
            onClose={() => setIsExportModalOpen(false)}
            onExportVCF={() =>
              exportarContactosVCF(
                selectedIds.length > 0
                  ? filteredContacts.filter((c) => selectedIds.includes(c.id || ""))
                  : filteredContacts
              )
            }
            onExportCSV={() =>
              exportarContactosCSV(
                selectedIds.length > 0
                  ? filteredContacts.filter((c) => selectedIds.includes(c.id || ""))
                  : filteredContacts
              )
            }
            onExportExcel={() =>
              exportarContactosExcel(
                selectedIds.length > 0
                  ? filteredContacts.filter((c) => selectedIds.includes(c.id || ""))
                  : filteredContacts
              )
            }
          />
        )}

        {/* =========================
           MODAL AGREGAR (Manual o VIISAN)
           ========================= */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsAddModalOpen(false)} />
            <div className="relative z-10 w-[92%] max-w-md rounded-2xl bg-white shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 text-center">
                Agregar contacto
              </h2>
              <p className="mt-2 text-sm text-gray-600 text-center">
                Selecciona cómo deseas agregar un nuevo contacto:
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    abrirFormularioNuevo();
                  }}
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 hover:bg-gray-50 active:scale-[0.99] transition"
                >
                  Manual
                </button>

                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    abrirScannerViisan();
                  }}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-red-600 text-white px-4 py-3 hover:bg-red-700 active:scale-[0.99] transition"
                >
                  Automático (VIISAN)
                </button>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* =========================
            BUSCADOR + FILTROS
            ========================= */}
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="Buscar por nombres, apellidos, teléfono o serie..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm
           focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
              />
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 select-none">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="accent-red-600"
                />
                Solo disponibles
              </label>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Total</span>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800">
                  {filteredContacts.length}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter(null)}
              className={`px-2 py-0.5 text-xs rounded-md border transition ${
                categoryFilter === null
                  ? "bg-red-600 text-white border-red-600 shadow-sm"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Todos
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter("parlamento")}
              className={`px-2 py-0.5 text-xs rounded-md border transition ${
                categoryFilter === "parlamento"
                  ? "bg-red-600 text-white border-red-600 shadow-sm"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Parlamento
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter("diputado")}
              className={`px-2 py-0.5 text-xs rounded-md border transition ${
                categoryFilter === "diputado"
                  ? "bg-red-600 text-white border-red-600 shadow-sm"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Diputado
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter("senador")}
              className={`px-2 py-0.5 text-xs rounded-md border transition ${
                categoryFilter === "senador"
                  ? "bg-red-600 text-white border-red-600 shadow-sm"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Senador
            </button>
          </div>
        </div>

        {/* Botón eliminar masivo */}
        <div className="w-full mt-4 flex justify-between items-center">
          {selectedIds.length > 0 && (
            <button
              onClick={solicitarEliminacionMasiva}
              className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-transform transform hover:scale-110"
              title="Eliminar seleccionados"
            >
              🗑️
            </button>
          )}
        </div>

        {/* Confirmación reutilizable */}
        <ConfirmDeleteModal
          open={confirmOpen}
          title={confirmTitle}
          message={confirmMessage}
          confirmText="Sí, confirmar"
          cancelText="Cancelar"
          onConfirm={() => confirmActionRef.current()}
          onClose={() => setConfirmOpen(false)}
        />

        {/* Tabla */}
        <div className="w-full mt-1 max-h-[600px] overflow-y-auto">
          <ContactTable
            contactos={filteredContacts}
            editarContacto={abrirEdicion}
            eliminarContacto={solicitarEliminacion}
            reactivarContacto={solicitarReactivacion}
            contactosSeleccionados={selectedIds}
            toggleSeleccion={alternarSeleccion}
          />
        </div>

        <DeletingOverlay open={isDeleting} progress={deleteProgress} />
      </main>
    </div>
  );
}
