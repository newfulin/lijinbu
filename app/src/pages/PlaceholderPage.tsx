type Props = {
  title: string;
  note?: string;
};

export function PlaceholderPage({ title, note }: Props) {
  return (
    <div className="flex h-full items-center justify-center rounded-card bg-card shadow-card">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-muted">{note ?? "页面占位 · 后续阶段接入"}</p>
      </div>
    </div>
  );
}
