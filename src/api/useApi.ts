import { useCallback, useEffect, useRef, useState } from "react";

export type QueryResult<T> = {
  retry: () => void;
} & ({ status: "loading" } | { status: "ready"; data: T } | { status: "error"; error: unknown });

type Stored<T> =
  | { key: string; attempt: number; status: "ready"; data: T }
  | { key: string; attempt: number; status: "error"; error: unknown };

export function useApi<T>(key: string, load: (signal: AbortSignal) => Promise<T>): QueryResult<T> {
  const loadRef = useRef(load);
  const [attempt, setAttempt] = useState(0);
  const [stored, setStored] = useState<Stored<T> | null>(null);

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
