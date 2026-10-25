const numberFormat = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 1 });

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatValue(
  value: number | string | null | undefined,
  unit?: string | null,
): string {
  if (value == null || value === "") return "—";
  const rendered = typeof value === "number" ? formatNumber(value) : value;
  return unit ? `${rendered} ${unit}` : rendered;
}

export function formatSigned(value: number): string {
  const rendered = formatNumber(Math.abs(value));
  if (value > 0) return `+${rendered}`;
  if (value < 0) return `−${rendered}`;
  return rendered;
}

export function formatShare(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function humaniseSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDistance(metres: number | null | undefined): string {
  if (metres == null) return "Distance not recorded";
  if (metres < 1000) return `${formatNumber(metres)} m`;
  return `${formatNumber(metres / 1000)} km`;
}
