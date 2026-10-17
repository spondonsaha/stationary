import { formatMoney } from "@/lib/config";

export type SalesPoint = { date: string; invoiceCount: number; revenue: number };

/**
 * Dependency-free bar chart. Rendered on the server so the reports page needs
 * no client JavaScript; hover a bar for the exact figure via <title>.
 */
export function SalesChart({ data }: { data: SalesPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-ink-400">No data in this range.</p>;
  }

  const width = 720;
  const height = 240;
  const padding = { top: 12, right: 8, bottom: 28, left: 8 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const slot = plotW / data.length;
  const barW = Math.max(2, Math.min(28, slot * 0.62));

  return (
    <figure className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-60 w-full min-w-[640px]"
        role="img"
        aria-label={`Daily sales for ${data.length} days`}
        preserveAspectRatio="none"
      >
        <line
          x1={padding.left}
          y1={padding.top + plotH}
          x2={padding.left + plotW}
          y2={padding.top + plotH}
          stroke="#d5d9df"
          strokeWidth="1"
        />
        {data.map((d, i) => {
          const h = (d.revenue / max) * plotH;
          const x = padding.left + i * slot + (slot - barW) / 2;
          const y = padding.top + plotH - h;
          const label = d.date.slice(5);
          const showLabel = data.length <= 14 || i % Math.ceil(data.length / 8) === 0;
          return (
            <g key={d.date}>
              <rect x={x} y={y} width={barW} height={Math.max(d.revenue > 0 ? 2 : 0, h)} rx="2" fill="#1F3A5F">
                <title>{`${d.date}: ${formatMoney(d.revenue)} · ${d.invoiceCount} invoice${d.invoiceCount === 1 ? "" : "s"}`}</title>
              </rect>
              {showLabel ? (
                <text
                  x={x + barW / 2}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#8b93a1"
                >
                  {label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 text-xs text-ink-400">
        Daily sales, {data[0]?.date} → {data[data.length - 1]?.date} · peak {formatMoney(max)}
      </figcaption>
    </figure>
  );
}
