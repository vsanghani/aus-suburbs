const KEY = "suburb-record.shortlist.v1";
const EVENT = "shortlist-change";
const EMPTY: KeptPlace[] = [];
let cachedRaw: string | null = null;
let cachedList: KeptPlace[] = EMPTY;

export type KeptPlace = {
  state: string;
  slug: string;
  name: string;
  savedAt: string;
};

function isKept(value: unknown): value is KeptPlace {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.state === "string" &&
    typeof record.slug === "string" &&
    typeof record.name === "string" &&
    typeof record.savedAt === "string"
  );
}

export function readShortlist(): KeptPlace[] {
  return shortlistSnapshot();
}

/** Stable snapshot for useSyncExternalStore. Server render uses an empty list. */
export function shortlistSnapshot(): KeptPlace[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cachedRaw) return cachedList;
    cachedRaw = raw;
    if (!raw) {
      cachedList = EMPTY;
      return cachedList;
    }
    const parsed: unknown = JSON.parse(raw);
    cachedList = Array.isArray(parsed) ? parsed.filter(isKept) : EMPTY;
    return cachedList;
  } catch {
    return EMPTY;
  }
}

export function serverShortlist(): KeptPlace[] {
  return EMPTY;
}

export function writeShortlist(places: KeptPlace[]): void {
  localStorage.setItem(KEY, JSON.stringify(places));
  window.dispatchEvent(new Event(EVENT));
}

export function isKeptPlace(state: string, slug: string): boolean {
  return readShortlist().some((place) => place.state === state && place.slug === slug);
}

export function toggleKept(place: KeptPlace): KeptPlace[] {
  const current = readShortlist();
  const exists = current.some((item) => item.state === place.state && item.slug === place.slug);
  const next = exists
    ? current.filter((item) => !(item.state === place.state && item.slug === place.slug))
    : [...current, place];
  writeShortlist(next);
  return next;
}

export function subscribeShortlist(listener: () => void): () => void {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
