export function suburbKey(state: string, slug: string): string {
  return `${state}:${slug}`;
}

export function stateKey(code: string): string {
  return `state:${code}`;
}

export function councilKey(state: string, slug: string): string {
  return `council:${state}:${slug}`;
}

export function rankingKey(slug: string, state = "all", region = "all", council = "all"): string {
  return `rank:${slug}:${state}:${region}:${council}`;
}

export function searchKey(query: string): string {
  return `search:${query}`;
}

export function exploreKey(metric: string, stateCode: string, layers: readonly string[]): string {
  return `${metric}|${stateCode}|${layers.join(",")}`;
}

export function compareKey(tokens: readonly string[]): string {
  return `compare:${tokens.join("|")}`;
}

export const METHODOLOGY_KEY = "methodology";
export const EXPORT_KEY = "export";
