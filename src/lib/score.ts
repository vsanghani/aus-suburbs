import type { FormulaTier } from "../config/formula";

export function tierFor(
  value: number | null | undefined,
  tiers: readonly FormulaTier[],
): string | null {
  if (value == null || Number.isNaN(value)) return null;
  const sorted = [...tiers].sort((a, b) => b.minimum - a.minimum);
  return sorted.find((tier) => value >= tier.minimum)?.label ?? null;
}
