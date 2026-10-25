import formula from "../../contracts/formula.json";

export const FORMULA = formula;

export type FormulaGroup = (typeof FORMULA.groups)[number];
export type FormulaTier = (typeof FORMULA.tiers)[number];
export type WeightDef = (typeof FORMULA.weights)[number];
