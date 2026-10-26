export type ThemeName = "light" | "dark";

const STORAGE_KEY = "theme";

export function currentTheme(): ThemeName {
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
  const meta = document.querySelector('meta[name="theme-color"]');
  const paper = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim();
  if (meta && paper) meta.setAttribute("content", paper);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // The choice still applies for this view when storage is blocked.
  }
}
