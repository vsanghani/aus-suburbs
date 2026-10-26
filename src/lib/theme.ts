import { useSyncExternalStore } from "react";

export type ThemeName = "light" | "dark";

const STORAGE_KEY = "theme";

export function currentTheme(): ThemeName {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function applyTheme(theme: ThemeName): void {
  if (theme === "dark") {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.style.colorScheme = "dark";
  } else {
    delete document.documentElement.dataset.theme;
    document.documentElement.style.colorScheme = "light";
  }
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // The choice still applies for this view when storage is blocked.
  }
}

function subscribeTheme(onStoreChange: () => void): () => void {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

/** Light during server render and hydration, then the document theme. */
export function useThemeName(): ThemeName {
  return useSyncExternalStore(subscribeTheme, currentTheme, () => "light");
}
