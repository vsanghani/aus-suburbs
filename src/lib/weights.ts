import { FORMULA } from "../config/formula";

export const WEIGHTS = FORMULA.weights;

export type WeightValues = Record<string, number>;

function blank(value: number): WeightValues {
  return Object.fromEntries(WEIGHTS.map((weight) => [weight.id, value]));
}

export const PRESETS: { id: string; label: string; values: WeightValues }[] = [
  { id: "even", label: "Even", values: blank(50) },
  {
    id: "renting",
    label: "Renting",
    values: {
      budget: 90,
      commute: 70,
      schools: 30,
      safety: 50,
      quiet: 40,
      family: 30,
      errands: 60,
      green: 30,
    },
  },
  {
    id: "family",
    label: "Family",
    values: {
      budget: 50,
      commute: 40,
      schools: 90,
      safety: 70,
      quiet: 40,
      family: 90,
      errands: 50,
      green: 60,
    },
  },
  {
    id: "quieter",
    label: "Quieter",
    values: {
      budget: 40,
      commute: 30,
      schools: 30,
      safety: 60,
      quiet: 90,
      family: 20,
      errands: 30,
      green: 70,
    },
  },
];

export function normaliseWeights(values: WeightValues): WeightValues {
  const total = WEIGHTS.reduce((sum, weight) => sum + Math.max(0, values[weight.id] ?? 0), 0);
  if (total <= 0) {
    const share = 1 / WEIGHTS.length;
    return Object.fromEntries(WEIGHTS.map((weight) => [weight.id, share]));
  }
  return Object.fromEntries(
    WEIGHTS.map((weight) => [weight.id, Math.max(0, values[weight.id] ?? 0) / total]),
  );
}

export function weightsMatch(left: WeightValues, right: WeightValues): boolean {
  return WEIGHTS.every((weight) => (left[weight.id] ?? 0) === (right[weight.id] ?? 0));
}

export function readWeights(params: URLSearchParams): WeightValues {
  const values: WeightValues = {};
  for (const weight of WEIGHTS) {
    const raw = params.get(weight.id);
    if (raw == null || raw === "") {
      values[weight.id] = 50;
      continue;
    }
    const parsed = Number(raw);
    values[weight.id] = Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 50;
  }
  return values;
}
