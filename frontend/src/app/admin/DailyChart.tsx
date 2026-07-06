import styles from './page.module.css';

interface Point {
  date: string;
  count: number;
}

export default function DailyChart({ data }: { data: Point[] }) {
  const width = 720;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 32, left: 32 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = Math.max(1, ...data.map((d) => d.count));
  const barSlot = innerW / Math.max(1, data.length);
  const barW = Math.max(2, barSlot - 3);

  // Show a rounded, human-friendly Y-axis: 4 ticks 0 → max, rounded up
  const step = Math.max(1, Math.ceil(max / 4));
  const yTicks = [0, step, step * 2, step * 3, step * 4];
  const yMax = yTicks[yTicks.length - 1];

  const formatDay = (iso: string) => {
    if (!iso || iso.length < 10) return '';
    return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
  };

  return (
    <svg className={styles.chart} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="הרשמות ב-30 הימים האחרונים">
      {yTicks.map((t) => {
        const y = padding.top + innerH - (t / yMax) * innerH;
        return (
          <g key={t}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#eef0f7" />
            <text className={styles.chartAxis} x={padding.left - 6} y={y + 4} textAnchor="end">{t}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const h = (d.count / yMax) * innerH;
        const x = padding.left + i * barSlot + (barSlot - barW) / 2;
        const y = padding.top + innerH - h;
        return (
          <g key={d.date}>
            <rect className={styles.chartBar} x={x} y={y} width={barW} height={h} rx={2}>
              <title>{`${d.date}: ${d.count}`}</title>
            </rect>
            {i % Math.ceil(data.length / 8) === 0 && (
              <text className={styles.chartAxis} x={x + barW / 2} y={height - padding.bottom + 16} textAnchor="middle">
                {formatDay(d.date)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
