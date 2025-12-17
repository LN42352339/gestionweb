// src/utils/paginationUtils.ts
import { Contacto } from "../domain/entities/contact";

/**
 * Filtra y pagina los contactos según el texto de búsqueda y la página actual.
 */
export function obtenerContactosPaginados(
  contactos: Contacto[],
  searchQuery: string,
  paginaActual: number,
  contactosPorPagina: number
) {
  const searchTerm = searchQuery.toLowerCase();

  // Filtrar por nombres, apellidos, área o teléfono
  const filtrados = contactos.filter((contacto) => {
    return (
      String(contacto.primerNombre || "")
        .toLowerCase()
        .includes(searchTerm) ||
      String(contacto.segundoNombre || "")
        .toLowerCase()
        .includes(searchTerm) ||
      String(contacto.primerApellido || "")
        .toLowerCase()
        .includes(searchTerm) ||
      String(contacto.segundoApellido || "")
        .toLowerCase()
        .includes(searchTerm) ||
      String(contacto.area || "")
        .toLowerCase()
        .includes(searchTerm) ||
      String(contacto.telefono || "")
        .toLowerCase()
        .includes(searchTerm)
    );
  });

  const totalPaginas = Math.ceil(filtrados.length / contactosPorPagina);
  const indiceUltimo = paginaActual * contactosPorPagina;
  const indicePrimero = indiceUltimo - contactosPorPagina;
  const paginados = filtrados.slice(indicePrimero, indiceUltimo);

  return {
    contactosPaginados: paginados,
    contactosFiltrados: filtrados,
    totalPaginas,
  };
}
