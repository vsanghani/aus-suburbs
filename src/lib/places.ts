const PLACE_TOKEN = /^[a-z]{2,3}:[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parsePlaceTokens(params: URLSearchParams): string[] {
  const kept: string[] = [];
  for (const token of params.getAll("p")) {
    const normalised = token.trim().toLowerCase();
    if (PLACE_TOKEN.test(normalised) && !kept.includes(normalised) && kept.length < 4) {
      kept.push(normalised);
    }
  }
  return kept;
}

export function splitToken(token: string): { state: string; slug: string } {
  const [state, slug] = token.split(":");
  return { state: state ?? "", slug: slug ?? "" };
}

export function suburbPath(state: string, slug: string): string {
  return `/suburbs/${state}/${slug}`;
}

export function councilPath(state: string, slug: string): string {
  return `/councils/${state}/${slug}`;
}
