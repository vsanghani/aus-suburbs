import { useEffect } from "react";
import { site } from "../config/site";

export function useDocumentTitle(part?: string): void {
  useEffect(() => {
    document.title = part ? `${part} · ${site.name}` : site.name;
  }, [part]);
}
