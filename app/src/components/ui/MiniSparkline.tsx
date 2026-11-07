type Props = {
  values: number[];
  positive?: boolean;
  className?: string;
};

/** 极简折线；无有效数据时不渲染 */
export function MiniSparkline({ values, positive = true, className = "" }: Props) {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length < 2) return null;
  const w = 120;
  const h = 28;
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = max - min || 1;
  const pts = clean
    .map((v, i) => {
      const x = (i / (clean.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const stroke = positive ? "#059669" : "#DC2626";
  const fill = positive ? "rgba(5,150,105,0.12)" : "rgba(220,38,38,0.10)";
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`mt-3 h-7 w-full ${className}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polygon points={area} fill={fill} />
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
