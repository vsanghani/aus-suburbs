import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { site } from "../config/site";
import { preloadMap } from "../lib/preloadMap";
import { shortlistSnapshot, subscribeShortlist } from "../lib/shortlist";
import { applyTheme, useThemeName, type ThemeName } from "../lib/theme";
import { Icon } from "./Icon";

const links = [
  { to: "/explore", label: "Explore", preload: true },
  { to: "/rankings", label: "Rankings", preload: false },
  { to: "/compare", label: "Compare", preload: false },
  { to: "/match", label: "Match", preload: false },
];

export function SiteHeader() {
  const location = useLocation();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === location.pathname;
  const theme = useThemeName();
  const kept = useSyncExternalStore(subscribeShortlist, keptCount, () => 0);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    navRef.current?.querySelector<HTMLElement>("a")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpenPath(null);
      toggleRef.current?.focus();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function choose(next: ThemeName) {
    applyTheme(next);
  }

  return (
    <header className={open ? "site-header is-open" : "site-header"}>
      <Link className="wordmark" to="/">
        {site.name}
      </Link>
      <nav ref={navRef} className="site-nav" id="site-nav" aria-label="Primary">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => setOpenPath(null)}
            onMouseEnter={link.preload ? preloadMap : undefined}
            onFocus={link.preload ? preloadMap : undefined}
          >
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
        ref={toggleRef}
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
