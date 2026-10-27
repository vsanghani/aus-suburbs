import { useEffect, useState, useSyncExternalStore } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { site } from "../config/site";
import { shortlistSnapshot, subscribeShortlist } from "../lib/shortlist";
import { applyTheme, useThemeName, type ThemeName } from "../lib/theme";
import { Icon } from "./Icon";

const links = [
  { to: "/explore", label: "Explore" },
  { to: "/rankings", label: "Rankings" },
  { to: "/compare", label: "Compare" },
  { to: "/match", label: "Match" },
];

export function SiteHeader() {
  const location = useLocation();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === location.pathname;
  const theme = useThemeName();
  const kept = useSyncExternalStore(subscribeShortlist, keptCount, () => 0);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenPath(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function choose(next: ThemeName) {
    applyTheme(next);
  }

  return (
    <header className={open ? "site-header is-open" : "site-header"}>
      <Link className="wordmark" to="/">
        {site.name}
      </Link>
      <nav className="site-nav" id="site-nav" aria-label="Primary">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} onClick={() => setOpenPath(null)}>
            {link.label}
          </NavLink>
        ))}
        <NavLink to="/shortlist" onClick={() => setOpenPath(null)}>
          {kept > 0 ? `Kept ${kept}` : "Kept"}
        </NavLink>
      </nav>
      <div className="theme-switch" role="group" aria-label="Colour theme">
        <button type="button" aria-pressed={theme === "light"} onClick={() => choose("light")}>
          <Icon name="sun" />
          <span className="theme-label">Light</span>
        </button>
        <button type="button" aria-pressed={theme === "dark"} onClick={() => choose("dark")}>
          <Icon name="moon" />
          <span className="theme-label">Dark</span>
        </button>
      </div>
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="site-nav"
        onClick={() => setOpenPath(open ? null : location.pathname)}
      >
        <Icon name={open ? "close" : "menu"} />
        {open ? "Close" : "Menu"}
      </button>
    </header>
  );
}

function keptCount(): number {
  return shortlistSnapshot().length;
}
