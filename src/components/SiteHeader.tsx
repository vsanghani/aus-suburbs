import { useEffect, useRef, useState, type MouseEvent } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { site } from "../config/site";
import { readShortlist, subscribeShortlist } from "../lib/shortlist";
import { preloadMap } from "../lib/preloadMap";
import { applyTheme, currentTheme, type ThemeName } from "../lib/theme";

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
  const [theme, setTheme] = useState<ThemeName>(() => currentTheme());
  const [kept, setKept] = useState(() => readShortlist().length);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => subscribeShortlist(() => setKept(readShortlist().length)), []);

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
    setTheme(next);
  }

  function closeMenu(restoreFocus: boolean) {
    setOpenPath(null);
    if (restoreFocus) toggleRef.current?.focus();
  }

  function onNavClick(event: MouseEvent<HTMLElement>) {
    const target = event.target;
    if (target instanceof Element && target.closest("a")) closeMenu(false);
  }

  return (
    <header className={open ? "site-header is-open" : "site-header"}>
      <NavLink className="wordmark" to="/" end>
        {site.name}
      </NavLink>
      <button
        ref={toggleRef}
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="primary-nav"
        onClick={() => (open ? closeMenu(false) : setOpenPath(location.pathname))}
      >
        {open ? "Close" : "Menu"}
      </button>
      <nav
        ref={navRef}
        id="primary-nav"
        className="site-nav"
        aria-label="Primary"
        onClick={onNavClick}
      >
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onMouseEnter={link.preload ? preloadMap : undefined}
            onFocus={link.preload ? preloadMap : undefined}
          >
            {link.label}
          </NavLink>
        ))}
        <NavLink to="/shortlist">{kept > 0 ? `Kept ${kept}` : "Kept"}</NavLink>
      </nav>
      <div className="theme-switch" role="group" aria-label="Colour theme">
        <button type="button" aria-pressed={theme === "light"} onClick={() => choose("light")}>
          Light
        </button>
        <button type="button" aria-pressed={theme === "dark"} onClick={() => choose("dark")}>
          Dark
        </button>
      </div>
      {open ? (
        <button
          type="button"
          className="nav-scrim"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => closeMenu(true)}
        />
      ) : null}
    </header>
  );
}
