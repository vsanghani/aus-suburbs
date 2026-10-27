export const MAP_STYLE = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
} as const;

export const EXPLORE_LAYERS = [
  { id: "boundary", label: "Suburb boundaries" },
  { id: "flood", label: "Flood overlay" },
  { id: "bushfire", label: "Bushfire overlay" },
  { id: "schools", label: "Schools" },
  { id: "transit", label: "Transit" },
  { id: "parks", label: "Parks" },
  { id: "offences", label: "Offence counts" },
] as const;

export const EXPLORE_LAYER_IDS = new Set<string>(EXPLORE_LAYERS.map((layer) => layer.id));
