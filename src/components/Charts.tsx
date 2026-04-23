import { useState } from "react";
import type { AmountBandRow, MonthlyRow, YearRow } from "../types";
import { compact, fmtAmount } from "../utils";
import { monthLabels } from "../dashboard/config";

export function LineChart({ rows, captionId }: { rows: YearRow[]; captionId: string }) {
  const width = 920;
  const height = 300;
  const pad = { left: 66, right: 24, top: 22, bottom: 46 };
  const [hovered, setHovered] = useState<YearRow | null>(null);
  const cleanRows = rows.filter((row): row is YearRow & { year: number } => row.year !== null);
  if (!cleanRows.length) return <div className="p-6 text-sm text-zinc-500">No yearly data for this selection.</div>;

  const max = Math.max(...cleanRows.map((row) => row.amount), 1);
  const niceSteps = [10_000_000, 25_000_000, 50_000_000, 100_000_000, 250_000_000, 500_000_000, 1_000_000_000, 2_500_000_000, 5_000_000_000, 10_000_000_000, 25_000_000_000, 50_000_000_000, 100_000_000_000, 250_000_000_000, 500_000_000_000, 1_000_000_000_000];
  const step = niceSteps.find((candidate) => Math.ceil(max / candidate) <= 4) || niceSteps.at(-1) || 1_000_000_000_000;
  const yMax = Math.max(step, Math.ceil(max / step) * step);
  const yTicks = Array.from({ length: Math.ceil(yMax / step) + 1 }, (_, index) => index * step);
  const yLabel = (value: number) => (value >= 1_000_000_000_000 ? `${value / 1_000_000_000_000}T` : value >= 1_000_000_000 ? `${value / 1_000_000_000}B` : `${value / 1_000_000}M`);
  const minYear = cleanRows[0].year;
  const maxYear = cleanRows.at(-1)?.year || minYear;
  const x = (year: number) => pad.left + ((year - minYear) / Math.max(maxYear - minYear, 1)) * (width - pad.left - pad.right);
  const y = (value: number) => height - pad.bottom - (value / yMax) * (height - pad.top - pad.bottom);
  const points = cleanRows.map((row) => ({ x: x(row.year), y: y(row.amount) }));
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const ticks = cleanRows.filter((_, index) => index % Math.ceil(cleanRows.length / 8) === 0 || index === cleanRows.length - 1);
  const hoveredPoint = hovered?.year ? { x: x(hovered.year), y: y(hovered.amount) } : null;

  return (
    <div className="relative overflow-x-auto">
      <svg className="block h-auto w-[760px] min-w-[760px] sm:w-full sm:min-w-0" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={captionId} onMouseLeave={() => setHovered(null)}>
        {yTicks.map((value) => {
          const tickY = y(value);
          return (
            <g key={value}>
              <line stroke="#27272a" strokeDasharray={value === 0 ? undefined : "4 6"} x1={pad.left} x2={width - pad.right} y1={tickY} y2={tickY} />
              {value > 0 && (
                <text className="fill-zinc-500 text-[11px]" textAnchor="end" x={pad.left - 10} y={tickY + 4}>
                  {yLabel(value)}
                </text>
              )}
            </g>
          );
        })}
        <path d={path} fill="none" stroke="#d7ff5f" strokeLinecap="round" strokeWidth="4" />
        {points.map((point, index) => {
          const row = cleanRows[index];
          return (
            <g key={`${point.x}-${index}`} onMouseEnter={() => setHovered(row)} onFocus={() => setHovered(row)} tabIndex={0} role="button" aria-label={`${row.year}: ${fmtAmount(row.amount)}`}>
              <circle cx={point.x} cy={point.y} fill="#f4f4f5" r="4" />
              <circle cx={point.x} cy={point.y} fill="transparent" r="14" />
            </g>
          );
        })}
        {hoveredPoint && (
          <>
            <line stroke="#52525b" strokeDasharray="4 5" x1={hoveredPoint.x} x2={hoveredPoint.x} y1={pad.top} y2={height - pad.bottom} />
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} fill="#d7ff5f" r="6" />
          </>
        )}
        {ticks.map((row) => (
          <text className="fill-zinc-500 text-[11px]" key={row.year} textAnchor="middle" x={x(row.year)} y={height - 16}>
            {row.year}
          </text>
        ))}
      </svg>
      {hovered && hoveredPoint && (
        <div
          className="pointer-events-none absolute z-10 rounded border border-zinc-700 bg-black px-3 py-2 text-xs shadow-xl shadow-black"
          style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
            transform: "translate(-50%, calc(-100% - 10px))",
          }}
        >
          <strong className="block text-zinc-100">{hovered.year}</strong>
          <span className="block whitespace-nowrap text-lime-300">{fmtAmount(hovered.amount)}</span>
          <span className="block whitespace-nowrap text-zinc-500">{compact.format(hovered.records)} contracts</span>
        </div>
      )}
    </div>
  );
}

export function BarChart({ rows, kind }: { rows: AmountBandRow[] | MonthlyRow[]; kind: "bands" | "months" }) {
  const max = Math.max(...rows.map((row) => row.amount), 1);
  return (
    <div className="grid gap-2">
      {rows.map((row, index) => {
        const label = kind === "bands" ? (row as AmountBandRow).band : monthLabels[(row as MonthlyRow).month - 1] || `${String((row as MonthlyRow).month).padStart(2, "0")}/${(row as MonthlyRow).year}`;
        return (
          <div className="grid items-center gap-1 text-sm sm:grid-cols-[132px_minmax(120px,1fr)_138px_78px] sm:gap-3" key={`${label}-${index}`}>
            <span className="min-w-0 font-bold text-zinc-100">{label}</span>
            <div className="h-3 overflow-hidden rounded border border-zinc-800 bg-black">
              <div className="h-full bg-gradient-to-r from-lime-300 to-sky-300" style={{ width: `${Math.max(2, (row.amount / max) * 100)}%` }} />
            </div>
            <strong className="font-black text-zinc-100 sm:text-right">{fmtAmount(row.amount)}</strong>
            <small className="text-zinc-500 sm:text-right">{compact.format(row.records)} records</small>
          </div>
        );
      })}
    </div>
  );
}
