// utils/dashboardUtils.ts
import { Contacto } from "../domain/entities/contact";


export function contarContactosPorArea(contactos: Contacto[]) {
  const conteo: { area: string; cantidad: number }[] = [];
  const agrupado: { [area: string]: number } = {};

  contactos.forEach((contacto) => {
    if (contacto.area) {
      agrupado[contacto.area] = (agrupado[contacto.area] || 0) + 1;
    }
  });

  for (const area in agrupado) {
    conteo.push({ area, cantidad: agrupado[area] });
  }

  return conteo;
}
