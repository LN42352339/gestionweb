import { Contacto } from "../domain/entities/contact";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

// Exportar a VCF (normalmente solo nombre + teléfono)
export function exportarContactosVCF(contactos: Contacto[]) {
  if (contactos.length === 0) {
    toast.warn("No hay contactos para exportar.");
    return;
  }

  let contenidoVCF = "";
  contactos.forEach((c) => {
    const nombreCompleto =
      c.nombreCompleto ||
      `${c.primerNombre} ${c.segundoNombre ?? ""} ${c.primerApellido} ${
        c.segundoApellido ?? ""
      }`
        .trim()
        .toUpperCase();

    contenidoVCF += `BEGIN:VCARD\nVERSION:3.0\n`;
    contenidoVCF += `FN:${nombreCompleto}\n`;
    contenidoVCF += `TEL;TYPE=CELL:${c.telefono}\n`;
    contenidoVCF += `END:VCARD\n`;
  });

  const blob = new Blob([contenidoVCF], { type: "text/vcard;charset=utf-8" });
  descargarArchivo(blob, "vcf");
}

// Exportar a CSV
export function exportarContactosCSV(contactos: Contacto[]) {
  if (contactos.length === 0) {
    toast.warn("No hay contactos para exportar.");
    return;
  }

  // ✅ Incluye categoria y createdAt
  const encabezados: (keyof Contacto)[] = [
    "primerNombre",
    "segundoNombre",
    "primerApellido",
    "segundoApellido",
    "nombreCompleto",
    "telefono",
    "area",
    "categoria",
    "fechaAtencion",
    "operador",
    "marca",
    "modelo",
    "serie",
    "createdAt",
  ];

  const csvContenido = [
    encabezados.join(","),
    ...contactos.map((c) =>
      encabezados
        .map((campo) => {
          const valor =
            campo === "nombreCompleto"
              ? c.nombreCompleto ||
                `${c.primerNombre} ${c.segundoNombre ?? ""} ${c.primerApellido} ${
                  c.segundoApellido ?? ""
                }`.trim()
              : c[campo];

          return `"${valor ? String(valor).replace(/"/g, '""') : ""}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContenido], { type: "text/csv;charset=utf-8;" });
  descargarArchivo(blob, "csv");
}

// Exportar a Excel
export function exportarContactosExcel(contactos: Contacto[]) {
  if (contactos.length === 0) {
    toast.warn("No hay contactos para exportar.");
    return;
  }

  const contactosFiltrados = contactos.map((c) => ({
    primerNombre: c.primerNombre,
    segundoNombre: c.segundoNombre ?? "",
    primerApellido: c.primerApellido,
    segundoApellido: c.segundoApellido ?? "",
    nombreCompleto:
      c.nombreCompleto ||
      `${c.primerNombre} ${c.segundoNombre ?? ""} ${c.primerApellido} ${
        c.segundoApellido ?? ""
      }`.trim(),
    telefono: c.telefono,
    area: c.area,
    categoria: c.categoria ?? "",
    fechaAtencion: c.fechaAtencion,
    operador: c.operador,
    marca: c.marca,
    modelo: c.modelo,
    serie: c.serie,
    createdAt: c.createdAt ?? "",
  }));

  const hoja = XLSX.utils.json_to_sheet(contactosFiltrados);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Contactos");

  const fecha = new Date().toISOString().slice(0, 10);
  const nombre = `contactos_seleccionados_${fecha}.xlsx`;
const wbout = XLSX.write(libro, { bookType: "xlsx", type: "array" });
const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

const a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = nombre;
a.click();
URL.revokeObjectURL(a.href);

}

/**
 * ✅ Descargar plantilla Excel para importar contactos
 * - Incluye columna "categoria" (parlamento / congresal)
 * - Incluye una fila de ejemplo para que el usuario copie/pegue
 */
export function descargarPlantillaContactos() {
  const ejemplo = [
    {
      primerNombre: "JUAN",
      segundoNombre: "CARLOS",
      primerApellido: "PEREZ",
      segundoApellido: "GOMEZ",
      area: "SISTEMAS",
      categoria: "parlamento", // ✅ clave
      fechaAtencion: "01/12/2025", // dd/mm/yyyy
      operador: "CLARO",
      telefono: "912345678", // 9 dígitos
      marca: "SAMSUNG",
      modelo: "A54",
      serie: "123456789012345", // 15 dígitos
    },
  ];

  const hoja = XLSX.utils.json_to_sheet(ejemplo);

  // ✅ Ajuste de anchos (se ve más bonito)
  hoja["!cols"] = [
    { wch: 14 }, // primerNombre
    { wch: 14 }, // segundoNombre
    { wch: 16 }, // primerApellido
    { wch: 16 }, // segundoApellido
    { wch: 18 }, // area
    { wch: 12 }, // categoria
    { wch: 14 }, // fechaAtencion
    { wch: 12 }, // operador
    { wch: 14 }, // telefono
    { wch: 12 }, // marca
    { wch: 12 }, // modelo
    { wch: 18 }, // serie
  ];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Plantilla");

  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(libro, `plantilla_import_contactos_${fecha}.xlsx`);
}

// Función común para descargar archivos VCF/CSV
function descargarArchivo(blob: Blob, tipo: "vcf" | "csv") {
  const enlace = document.createElement("a");
  const fecha = new Date().toISOString().slice(0, 10);
  enlace.href = URL.createObjectURL(blob);
  enlace.download = `contactos_seleccionados_${fecha}.${tipo}`;
  enlace.click();
}
