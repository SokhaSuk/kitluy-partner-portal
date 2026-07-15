import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useId } from 'react';
import { khr } from '../lib/format.js';

const AXIS = { fontSize: 11, fill: 'var(--faint)' };

/** Recharts renders into SVG, so `var(--…)` resolves against the app root. */
const GRID = { stroke: 'var(--border)', strokeDasharray: '3 4' };

function ChartTooltip({ active, payload, label, format }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] border border-border bg-panel px-3 py-2 shadow-pop">
      <div className="mb-1 text-[11.5px] font-semibold text-text">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-[12px] text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: p.stroke || p.color }} />
          <span className="capitalize">{p.name}</span>
          <span className="ml-auto font-semibold text-text">
            {format ? format(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

const REVENUE = [
  { day: 'Wed', revenue: 980_000 },
  { day: 'Thu', revenue: 1_120_000 },
  { day: 'Fri', revenue: 1_040_000 },
  { day: 'Sat', revenue: 1_260_000 },
  { day: 'Sun', revenue: 1_180_000 },
  { day: 'Mon', revenue: 1_340_000 },
  { day: 'Tue', revenue: 1_284_000 },
];

/** Daily gross revenue, last 7 days (KHR). */
export function RevenueBarChart({
  height = 200,
  data = REVENUE,
  domain = [0, 'auto'],
  idPrefix,
  ariaLabel = 'Daily gross revenue for the last seven days',
}) {
  const reactId = useId().replace(/:/g, '');
  const gradientId = idPrefix || `revenue-gradient-${reactId}`;
  return (
    <div role="img" aria-label={ariaLabel}>
      <span className="sr-only">
        {data.map((item) => `${item.day}: ${khr(item.revenue)}`).join(', ')}
      </span>
      <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 4, bottom: 0, left: 4 }} barCategoryGap="28%">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.95} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={AXIS} dy={4} />
        <YAxis hide domain={domain} />
        <Tooltip
          cursor={{ fill: 'var(--hover)', radius: 6 }}
          content={<ChartTooltip format={khr} />}
        />
        <Bar dataKey="revenue" name="Revenue" fill={`url(#${gradientId})`} radius={[6, 6, 0, 0]} />
      </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const FLOW = [
  { service: 'Wash & Fold', received: 38, ready: 30 },
  { service: 'Dry Clean', received: 44, ready: 36 },
  { service: 'Express Wash', received: 40, ready: 38 },
  { service: 'Press Only', received: 24, ready: 21 },
];

/** A service name longer than the axis gutter would be clipped; the tooltip and
    the screen-reader summary both still carry the full name. */
const shortService = (value) => {
  const name = String(value ?? '');
  return name.length > 14 ? `${name.slice(0, 13)}…` : name;
};

/**
 * Orders received vs. ready, per service.
 *
 * Bars, laid out horizontally — not the Area + Line this used to be. Two things
 * were wrong with that:
 *
 * 1. `type="monotone"` drew a smooth curve *between* services, interpolating
 *    "Wash & Fold" into "Dry Clean" as though the space between them measured
 *    something. Services are discrete categories; only bars say that honestly.
 * 2. The category names are long, and on an x-axis the first and last tick sit
 *    centred on the plot edge — so they overflowed the SVG and were clipped
 *    ("…sh & Fold"). On a y-axis they read straight out at full length, with no
 *    rotation and nothing to collide with.
 *
 * `layout="vertical"` is Recharts' name for bars that run horizontally.
 */
export function OrdersByServiceChart({
  height = 200,
  data = FLOW,
  domain = [0, 'auto'],
  ariaLabel = 'Orders received compared with orders ready for pickup, per service',
}) {
  // One fixed height would crush the bars as soon as a store adds services.
  const plotHeight = Math.max(height, data.length * 46);

  return (
    <div role="img" aria-label={ariaLabel}>
      <span className="sr-only">
        {data
          .map((item) => `${item.service}: ${item.received} received, ${item.ready} ready`)
          .join('. ')}
      </span>
      <ResponsiveContainer width="100%" height={plotHeight}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 30, bottom: 0, left: 0 }}
          barCategoryGap="26%"
          barGap={2}
        >
          {/* Bars run horizontally, so the useful rules are the vertical ones. */}
          <CartesianGrid {...GRID} horizontal={false} />
          <XAxis type="number" hide domain={domain} />
          <YAxis
            type="category"
            dataKey="service"
            tickLine={false}
            axisLine={false}
            tick={AXIS}
            tickFormatter={shortService}
            // 104px fits the 14-character cap `shortService` enforces, at the
            // widest glyphs 11px will produce. Narrower and the cap still spills.
            width={104}
          />
          <Tooltip cursor={{ fill: 'var(--hover)' }} content={<ChartTooltip />} />

          {/* --gold-fg, not --gold: plain --gold sits at 1.97:1 on a white panel,
              which is under the 3:1 floor a chart mark has to clear. Both tokens
              already follow [data-theme], so this stays correct in dark. */}
          <Bar dataKey="received" name="Received" fill="var(--accent)" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="received" position="right" fill="var(--muted)" fontSize={11} />
          </Bar>
          <Bar dataKey="ready" name="Ready" fill="var(--gold-fg)" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="ready" position="right" fill="var(--muted)" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
