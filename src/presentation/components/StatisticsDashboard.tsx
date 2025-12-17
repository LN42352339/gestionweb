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

export type PuntoArea = { area: string; cantidad: number };

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

type Props = {
  datosGrafico: PuntoArea[];
  cantidadContactos: number;
  cantidadEliminados: number;
  areaConMasContactos: string;
  cantidadDisponibles: number;
};

export default function StatisticsDashboard({
  datosGrafico = [],
  cantidadContactos = 0,
  cantidadEliminados = 0,
  areaConMasContactos = "Sin datos",
  cantidadDisponibles = 0,
}: Props) {
  // ~12 etiquetas visibles en X
  const tickInterval = Math.max(1, Math.ceil((datosGrafico.length || 1) / 12));
  const shortLabel = (v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v);

  return (
    <div className="min-h-[70vh] bg-white p-6 rounded-2xl shadow-2xl w-full">
      <h3 className="text-3xl font-bold mb-8 text-center text-slate-700">
        📊 Estadísticas de Contactos
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10 text-center">
        <Card
          title="Contactos Activos"
          value={cantidadContactos}
          valueClass="text-blue-600 text-4xl"
        />
        <Card
          title="Contactos Eliminados"
          value={cantidadEliminados}
          valueClass="text-red-500 text-4xl"
        />
        <Card
          title="Área con más contactos"
          value={areaConMasContactos}
          valueClass="text-green-600 text-lg"
        />
        <Card
          title="Disponibles"
          value={cantidadDisponibles}
          valueClass="text-purple-600 text-4xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Barras por área */}
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGrafico}>
              <CartesianGrid
                vertical={false}
                stroke="#e5e7eb"
                strokeDasharray="0"
              />
              <XAxis
                dataKey="area"
                tick={{ fontSize: 10, fill: "#374151" }}
                interval={tickInterval}
                angle={-45}
                textAnchor="end"
                height={90}
                tickLine={false}
                tickFormatter={shortLabel}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" name="Cantidad">
                {datosGrafico.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Torta por área (sin letras dentro; usa leyenda si la quieres) */}
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={datosGrafico}
                dataKey="cantidad"
                nameKey="area"
                outerRadius={110}
                label={false} // 🔒 sin etiquetas
                labelLine={false}
              >
                {datosGrafico.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              {/* Activa esta Leyenda si quieres la lista a la derecha */}
              {/* <Legend layout="vertical" align="right" verticalAlign="middle" /> */}
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  valueClass = "",
}: {
  title: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow">
      <h4 className="text-lg font-semibold text-gray-600">{title}</h4>
      <p className={`font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}
