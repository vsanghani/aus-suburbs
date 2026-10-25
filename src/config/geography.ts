import states from "../../contracts/states.json";

export type StateRecord = (typeof states)[number];

export const STATES: StateRecord[] = states;

export const AUSTRALIA = {
  centre: [134.5, -28] as [number, number],
  zoom: 3.55,
};

export function findState(code: string | undefined): StateRecord | undefined {
  if (!code) return undefined;
  return STATES.find((state) => state.code === code.toLowerCase());
}

export function stateView(code: string | undefined): { centre: [number, number]; zoom: number } {
  const state = findState(code);
  if (!state) return AUSTRALIA;
  const [longitude, latitude] = state.centre;
  return { centre: [longitude, latitude], zoom: state.zoom };
}
