type Props = {
  name: string;
  size?: "sm" | "md";
  tone?: "primary" | "neutral";
};

export function Avatar({ name, size = "sm", tone = "primary" }: Props) {
  const ch = (name || "?").trim().slice(0, 1) || "?";
  const dim = size === "md" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";
  const colors =
    tone === "primary"
      ? "bg-primary-soft text-primary-dark"
      : "bg-slate-100 text-ink-muted";
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium ${dim} ${colors}`}
      aria-hidden
    >
      {ch}
    </div>
  );
}
