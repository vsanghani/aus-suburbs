import { useCallback, useEffect, useRef, useState } from "react";

export type QueryResult<T> = {
  retry: () => void;
} & ({ status: "loading" } | { status: "ready"; data: T } | { status: "error"; error: unknown });

export type QuerySeed<T> =
  { key: string; status: "ready"; data: T } | { key: string; status: "error"; error: unknown };

type Stored<T> =
  | { key: string; attempt: number; status: "ready"; data: T }
  | { key: string; attempt: number; status: "error"; error: unknown };

export function useApi<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<T>,
  seed?: QuerySeed<T> | null,
): QueryResult<T> {
  const loadRef = useRef(load);
  const [attempt, setAttempt] = useState(0);
  const [stored, setStored] = useState<Stored<T> | null>(() => seedStored(key, seed));

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    loadRef.current(controller.signal).then(
      (data) => {
        if (active) setStored({ key, attempt, status: "ready", data });
      },
      (error: unknown) => {
        if (!active) return;
        setStored({ key, attempt, status: "error", error });
      },
    );
    return () => {
      active = false;
      controller.abort();
    };
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  if (stored && stored.key === key && stored.attempt === attempt) {
    return stored.status === "ready"
      ? { status: "ready", data: stored.data, retry }
      : { status: "error", error: stored.error, retry };
  }
  return { status: "loading", retry };
}

function seedStored<T>(key: string, seed: QuerySeed<T> | null | undefined): Stored<T> | null {
  if (!seed || seed.key !== key) return null;
  if (seed.status === "ready") return { key, attempt: 0, status: "ready", data: seed.data };
  return { key, attempt: 0, status: "error", error: seed.error };
}
