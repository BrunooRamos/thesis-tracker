"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { FlaskConical } from "lucide-react";
import type { ExperimentWithRelations } from "./experiment-lab";

const COLORS = {
  primary: "#ff7c11",
  secondary: "#9a4a00",
  tertiary: "#06b6d4",
};

function truncate(str: string, len: number) {
  return str.length > len ? str.slice(0, len) + "..." : str;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1c24] text-white rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(3) : entry.value}
        </p>
      ))}
    </div>
  );
};

export function ExperimentCharts({
  experiments,
}: {
  experiments: ExperimentWithRelations[];
}) {
  const completedWithMetrics = useMemo(
    () =>
      experiments.filter(
        (e) =>
          e.status === "COMPLETED" &&
          (e.exhaustivity != null || e.precision != null)
      ),
    [experiments]
  );

  if (completedWithMetrics.length === 0) {
    return (
      <div className="text-center py-16">
        <FlaskConical className="w-8 h-8 text-[#d3cfc6] mx-auto mb-3" />
        <p className="text-sm text-[#535766]">
          No hay experimentos completados con metricas
        </p>
        <p className="text-xs text-[#535766]/60 mt-1">
          Completa experimentos con metricas para ver graficos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ComparisonBarChart experiments={completedWithMetrics} />
      <EvolutionLineChart experiments={experiments} />
      <RadarComparisonChart experiments={completedWithMetrics} />
    </div>
  );
}

/* ─── Comparison Bar Chart ─── */

function ComparisonBarChart({
  experiments,
}: {
  experiments: ExperimentWithRelations[];
}) {
  const data = experiments.map((e) => ({
    name: truncate(e.name, 18),
    exhaustivity: e.exhaustivity ?? 0,
    precision: e.precision ?? 0,
  }));

  return (
    <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-5">
      <h3 className="text-xs font-semibold text-[#1a1c24] uppercase tracking-wider mb-4">
        Comparacion de metricas
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d3cfc6" opacity={0.5} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#535766" }}
            tickLine={false}
            axisLine={{ stroke: "#d3cfc6" }}
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: 11, fill: "#535766" }}
            tickLine={false}
            axisLine={{ stroke: "#d3cfc6" }}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "11px", color: "#535766" }}
          />
          <Bar
            dataKey="exhaustivity"
            name="Exhaustividad"
            fill={COLORS.primary}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="precision"
            name="Precision"
            fill={COLORS.secondary}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Evolution Line Chart ─── */

function EvolutionLineChart({
  experiments,
}: {
  experiments: ExperimentWithRelations[];
}) {
  // Find experiments that are part of iteration chains (have parentId or children)
  const iterationChains = useMemo(() => {
    // Group by root parent
    const roots = experiments.filter(
      (e) => !e.parentId && e.childExperiments.length > 0
    );

    if (roots.length === 0) return [];

    return roots.map((root) => {
      const chain: ExperimentWithRelations[] = [root];
      let current = root;
      // Walk down the iteration chain
      while (current.childExperiments.length > 0) {
        const childId = current.childExperiments[0].id;
        const child = experiments.find((e) => e.id === childId);
        if (!child) break;
        chain.push(child);
        current = child;
      }
      return { root: root.name, chain };
    });
  }, [experiments]);

  if (iterationChains.length === 0) {
    return (
      <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-5">
        <h3 className="text-xs font-semibold text-[#1a1c24] uppercase tracking-wider mb-4">
          Evolucion por iteracion
        </h3>
        <div className="text-center py-8">
          <p className="text-xs text-[#535766]">Sin datos de iteracion</p>
          <p className="text-[10px] text-[#535766]/60 mt-1">
            Crea iteraciones de un experimento para ver su evolucion
          </p>
        </div>
      </div>
    );
  }

  // Use the first chain for display
  const chainData = iterationChains[0].chain.map((e) => ({
    iteration: `v${e.iteration}`,
    exhaustivity: e.exhaustivity,
    precision: e.precision,
    latency: e.latency,
  }));

  return (
    <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-5">
      <h3 className="text-xs font-semibold text-[#1a1c24] uppercase tracking-wider mb-1">
        Evolucion por iteracion
      </h3>
      <p className="text-[10px] text-[#535766] mb-4">{iterationChains[0].root}</p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chainData}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#d3cfc6" opacity={0.5} />
          <XAxis
            dataKey="iteration"
            tick={{ fontSize: 11, fill: "#535766" }}
            tickLine={false}
            axisLine={{ stroke: "#d3cfc6" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#535766" }}
            tickLine={false}
            axisLine={{ stroke: "#d3cfc6" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "11px", color: "#535766" }} />
          <Line
            type="monotone"
            dataKey="exhaustivity"
            name="Exhaustividad"
            stroke={COLORS.primary}
            strokeWidth={2}
            dot={{ fill: COLORS.primary, r: 4 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="precision"
            name="Precision"
            stroke={COLORS.secondary}
            strokeWidth={2}
            dot={{ fill: COLORS.secondary, r: 4 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="latency"
            name="Latencia (s)"
            stroke={COLORS.tertiary}
            strokeWidth={2}
            dot={{ fill: COLORS.tertiary, r: 4 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Radar Comparison Chart ─── */

function RadarComparisonChart({
  experiments,
}: {
  experiments: ExperimentWithRelations[];
}) {
  const [selected, setSelected] = useState<string[]>(() =>
    experiments.slice(0, Math.min(2, experiments.length)).map((e) => e.id)
  );

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  const selectedExps = experiments.filter((e) => selected.includes(e.id));

  // Normalize values for radar (invert latency and cost so higher = better)
  const maxLatency = Math.max(
    ...experiments.map((e) => e.latency ?? 0),
    0.001
  );
  const maxCost = Math.max(...experiments.map((e) => e.cost ?? 0), 0.001);

  const radarData = [
    {
      axis: "Exhaustividad",
      ...Object.fromEntries(
        selectedExps.map((e) => [e.id, e.exhaustivity ?? 0])
      ),
    },
    {
      axis: "Precision",
      ...Object.fromEntries(
        selectedExps.map((e) => [e.id, e.precision ?? 0])
      ),
    },
    {
      axis: "1 - Latencia",
      ...Object.fromEntries(
        selectedExps.map((e) => [
          e.id,
          1 - (e.latency ?? 0) / maxLatency,
        ])
      ),
    },
    {
      axis: "1 - Costo",
      ...Object.fromEntries(
        selectedExps.map((e) => [e.id, 1 - (e.cost ?? 0) / maxCost])
      ),
    },
  ];

  const radarColors = [COLORS.primary, COLORS.secondary, COLORS.tertiary];

  return (
    <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-5">
      <h3 className="text-xs font-semibold text-[#1a1c24] uppercase tracking-wider mb-4">
        Comparacion radar (max 3)
      </h3>

      {/* Selection checkboxes */}
      <div className="flex flex-wrap gap-2 mb-4">
        {experiments.map((e) => (
          <label
            key={e.id}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] cursor-pointer transition-colors ${
              selected.includes(e.id)
                ? "border-[#ff7c11] bg-[#ff7c11]/10 text-[#ff7c11]"
                : "border-[#d3cfc6] bg-white/40 text-[#535766] hover:border-[#535766]"
            } ${
              !selected.includes(e.id) && selected.length >= 3
                ? "opacity-40 cursor-not-allowed"
                : ""
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(e.id)}
              onChange={() => toggle(e.id)}
              disabled={!selected.includes(e.id) && selected.length >= 3}
              className="sr-only"
            />
            {truncate(e.name, 20)}
          </label>
        ))}
      </div>

      {selectedExps.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xs text-[#535766]">
            Selecciona al menos un experimento
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#d3cfc6" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 11, fill: "#535766" }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 1]}
              tick={{ fontSize: 9, fill: "#535766" }}
            />
            {selectedExps.map((e, i) => (
              <Radar
                key={e.id}
                name={truncate(e.name, 16)}
                dataKey={e.id}
                stroke={radarColors[i]}
                fill={radarColors[i]}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
            <Legend wrapperStyle={{ fontSize: "11px", color: "#535766" }} />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
