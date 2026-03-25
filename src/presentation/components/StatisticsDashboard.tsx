// src/presentation/components/StatisticsDashboard.tsx
import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/* =========================================================
   ✅ TIPOS DE DATOS (lo que recibe este dashboard)
   ========================================================= */
export type PuntoArea = { area: string; cantidad: number };

export type EquipoDisponible = {
  // 📌 Número telefónico del equipo disponible
  numero?: string;

  // 📌 Marca del equipo (SAMSUNG, IPHONE, etc.)
  marca?: string;

  // 📌 Modelo del equipo
  modelo?: string;

  // 📌 IMEI / Serie del equipo
  imei?: string;
};

/* =========================================================
   ✅ COLORES para gráficos (Pie/Bar)
   ========================================================= */
const COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#f59e0b",
  "#7c3aed",
  "#0ea5e9",
  "#ef4444",
  "#22c55e",
  "#a855f7",
  "#eab308",
  "#6366f1",
  "#14b8a6",
  "#f97316",
  "#84cc16",
  "#d946ef",
  "#06b6d4",
];

/* =========================================================
   ✅ PROPS (valores que manda EstadisticasPage)
   ========================================================= */
type Props = {
  datosGrafico: PuntoArea[];
  cantidadContactos: number; // ✅ Activos (recomendado)
  cantidadEliminados: number; // ✅ solo BAJA_PERSONA
  areaConMasContactos: string;
  cantidadDisponibles: number; // ✅ INACTIVOS / plazas libres
  equiposDisponibles?: EquipoDisponible[]; // ✅ detalle para mostrar en tabla con scroll
};

/* =========================================================
   ✅ HELPERS (funciones pequeñas y fáciles)
   ========================================================= */
function formatNumber(n: number) {
  return new Intl.NumberFormat("es-PE").format(n);
}

function percent(part: number, total: number) {
  if (!total) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

const isOtros = (area: string) => String(area || "").trim().toUpperCase() === "OTROS";
const safeText = (v: unknown) => String(v ?? "").trim();

/* =========================================================
   ✅ COMPONENTE PRINCIPAL
   ========================================================= */
export default function StatisticsDashboard({
  datosGrafico = [],
  cantidadContactos = 0,
  cantidadEliminados = 0,
  areaConMasContactos = "Sin datos",
  cantidadDisponibles = 0,
  equiposDisponibles = [],
}: Props) {
  /* =========================================================
     BLOQUE 1: CÁLCULOS RÁPIDOS (total + top 5)
     ========================================================= */
  const total = useMemo(
    () => datosGrafico.reduce((acc, x) => acc + (x.cantidad || 0), 0),
    [datosGrafico]
  );

  const top5 = useMemo(() => {
    const sinOtros = datosGrafico.filter((x) => !isOtros(x.area));
    const sorted = [...sinOtros].sort((a, b) => b.cantidad - a.cantidad);
    return sorted.slice(0, 5);
  }, [datosGrafico]);

  /* =========================================================
     BLOQUE 2: FORMATO DE GRÁFICOS (labels + tooltip)
     ========================================================= */
  const shortLabel = (v: string) => (v.length > 22 ? `${v.slice(0, 21)}…` : v);

  const tooltipFormatter = (value: unknown, name: unknown) => {
    const v = typeof value === "number" ? value : Number(value || 0);
    const pct = percent(v, total);
    return [`${formatNumber(v)} (${pct})`, String(name ?? "Cantidad")];
  };

  const axisTooltip = (label: unknown) => String(label ?? "");

  const renderPieLabel = (entry: PuntoArea) => {
    const pct = total ? (entry.cantidad / total) * 100 : 0;
    // ✅ Si es muy pequeño, no mostramos texto (para no ensuciar)
    if (pct < 6) return "";
    return `${pct.toFixed(1)}%`;
  };

  /* =========================================================
     BLOQUE 3: UI GENERAL (contenedor + título)
     ========================================================= */
  return (
    <div className="stats-report min-h-[70vh] bg-white p-6 rounded-2xl shadow-2xl w-full">
      <h3 className="text-3xl font-bold mb-8 text-center text-slate-700">
        📊 Estadísticas de Contactos
      </h3>

      {/* =========================================================
         BLOQUE 4: KPIs (tarjetas rápidas)
         ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8 text-center">
        <Card
          title="Contactos Activos"
          value={formatNumber(cantidadContactos)}
          valueClass="text-blue-600 text-4xl"
          subtitle="Total actual"
        />

        <Card
          title="Contactos Eliminados"
          value={formatNumber(cantidadEliminados)}
          valueClass="text-red-500 text-4xl"
          subtitle="Solo BAJA_PERSONA"
        />

        <Card
          title="Área con más contactos"
          value={areaConMasContactos}
          valueClass="text-green-600 text-lg"
          subtitle="Líder actual"
        />

        <Card
          title="Disponibles"
          value={formatNumber(cantidadDisponibles)}
          valueClass="text-purple-600 text-4xl"
          subtitle="Plazas libres (INACTIVOS)"
        />
      </div>

      {/* =========================================================
         BLOQUE 5: TOP 5 ÁREAS (mitad izquierda) + DISPONIBLES (mitad derecha)
         - ✅ Cada bloque ocupa 50% en pantallas md+
         - ✅ Menos “espacio muerto”
         - ✅ Tablas con scroll
         ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* ---------- TOP 5 ÁREAS ---------- */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <h4 className="text-lg font-semibold text-slate-700 mb-3">
            🏆 Top 5 áreas
          </h4>

          {top5.length === 0 ? (
            <p className="text-sm text-gray-600">Sin datos para mostrar.</p>
          ) : (
            <div className="max-h-[260px] overflow-auto pr-2 rounded-xl print-no-scroll print-auto-height">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50 print-static-head">
                  <tr className="text-left text-gray-600 border-b border-gray-200">
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 pr-2">Área</th>
                    <th className="py-2 pr-2 text-right">Cantidad</th>
                    <th className="py-2 pr-2 text-right">%</th>
                  </tr>
                </thead>

                <tbody>
                  {top5.map((x, i) => (
                    <tr
                      key={`${x.area}-${i}`}
                      className="border-t border-gray-200 hover:bg-white/70 transition-colors"
                    >
                      <td className="py-2 pr-2 font-semibold text-gray-700">
                        {i + 1}
                      </td>
                      <td className="py-2 pr-2 text-gray-700 whitespace-normal break-words">
                        {x.area}
                      </td>
                      <td className="py-2 pr-2 text-right font-semibold text-gray-900 tabular-nums">
                        {formatNumber(x.cantidad)}
                      </td>
                      <td className="py-2 pr-2 text-right text-gray-700 tabular-nums">
                        {percent(x.cantidad, total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500">
            Total considerado: <b>{formatNumber(total)}</b>
          </p>
        </div>

        {/* ---------- EQUIPOS DISPONIBLES ---------- */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 group">
          <h4 className="text-lg font-semibold text-slate-700 mb-3">
            📱 Equipos disponibles
          </h4>

          {equiposDisponibles.length === 0 ? (
            <p className="text-sm text-gray-600">
              No hay equipos disponibles para mostrar.
            </p>
          ) : (
            <div className="h-[260px] overflow-auto pr-2 rounded-xl print-no-scroll print-auto-height">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50 print-static-head">
                  <tr className="text-left text-gray-600 border-b border-gray-200">
                    <th className="py-2 pr-2">Número</th>
                    <th className="py-2 pr-2">Marca</th>
                    <th className="py-2 pr-2">Modelo</th>
                    <th className="py-2 pr-2 text-right">IMEI</th>
                  </tr>
                </thead>

                <tbody>
                  {equiposDisponibles.map((e, i) => {
                    const numero = safeText(e.numero) || "-";
                    const marca = safeText(e.marca) || "-";
                    const modelo = safeText(e.modelo) || "-";
                    const imei = safeText(e.imei) || "-";

                    return (
                      <tr
                        key={`${numero}-${i}`}
                        className="border-t border-gray-200 hover:bg-white/70 transition-colors"
                      >
                        <td className="py-2 pr-2 font-semibold text-gray-800 tabular-nums">
                          {numero}
                        </td>
                        <td className="py-2 pr-2 text-gray-700">{marca}</td>
                        <td className="py-2 pr-2 text-gray-700">{modelo}</td>
                        <td className="py-2 pr-2 text-right text-gray-700 tabular-nums">
                          {imei}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-[11px] text-gray-400 mt-2 print-hide opacity-0 group-hover:opacity-100 transition-opacity">
            Tip: puedes hacer scroll si hay muchos disponibles.
          </p>
        </div>
      </div>

      {/* =========================================================
         BLOQUE 6: GRÁFICOS (Barras + Pie)
         ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ---------- GRÁFICO DE BARRAS ---------- */}
        <div className="h-[380px] bg-white border border-gray-200 rounded-2xl p-3 print-auto-height">
          <h4 className="text-base font-semibold text-slate-700 px-2 py-2">
            📊 Distribución por área
          </h4>

          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGrafico}>
              <CartesianGrid vertical={false} stroke="#e5e7eb" strokeDasharray="0" />
              <XAxis
                dataKey="area"
                tick={{ fontSize: 10, fill: "#374151" }}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={90}
                tickLine={false}
                tickFormatter={shortLabel}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={tooltipFormatter} labelFormatter={axisTooltip} />
              <Legend wrapperStyle={{ paddingTop: 6 }} />

              <Bar dataKey="cantidad" name="Cantidad">
                {datosGrafico.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ---------- GRÁFICO PIE + LEYENDA ---------- */}
        <div className="h-[380px] bg-white border border-gray-200 rounded-2xl p-3 print-auto-height group">
          <h4 className="text-base font-semibold text-slate-700 px-2 py-2">
            🧩 Participación por área
          </h4>

          <div className="flex h-[320px] gap-3 min-h-0 print-auto-height">
            {/* Pie */}
            <div className="flex-1 min-w-0 h-full print-auto-height">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosGrafico}
                    dataKey="cantidad"
                    nameKey="area"
                    outerRadius={115}
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {datosGrafico.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={tooltipFormatter} labelFormatter={axisTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Leyenda con scroll */}
            <div className="w-[310px] border-l border-gray-200 pl-3 h-full min-h-0 flex flex-col print-auto-height">
              <p className="text-xs font-semibold text-gray-600 mb-2">Áreas</p>

              <div className="h-[285px] overflow-auto pr-2 print-no-scroll print-auto-height">
                {datosGrafico.map((item, i) => (
                  <div key={`${item.area}-${i}`} className="flex items-start gap-2 py-1">
                    <span
                      className="mt-1 inline-block h-3 w-3 rounded-sm shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-800 break-words">{item.area}</p>
                      <p className="text-[11px] text-gray-500">
                        {formatNumber(item.cantidad)} · {percent(item.cantidad, total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-gray-400 mt-2 print-hide opacity-0 group-hover:opacity-100 transition-opacity">
                Tip: puedes hacer scroll si hay muchas áreas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ✅ COMPONENTE CARD (tarjetas KPI)
   ========================================================= */
function Card({
  title,
  value,
  valueClass = "",
  subtitle,
}: {
  title: string;
  value: React.ReactNode;
  valueClass?: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-sm group">
      <h4 className="text-lg font-semibold text-gray-600">{title}</h4>

      <p className={`font-bold ${valueClass}`}>{value}</p>

      {subtitle ? (
        <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
