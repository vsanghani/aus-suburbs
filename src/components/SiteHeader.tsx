import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { site } from "../config/site";
import { readShortlist, subscribeShortlist } from "../lib/shortlist";
import { applyTheme, currentTheme, type ThemeName } from "../lib/theme";

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
  const [theme, setTheme] = useState<ThemeName>(() => currentTheme());
  const [kept, setKept] = useState(() => readShortlist().length);

  useEffect(() => subscribeShortlist(() => setKept(readShortlist().length)), []);

  function choose(next: ThemeName) {
    applyTheme(next);
    setTheme(next);
  }

  return (
    <header className={open ? "site-header is-open" : "site-header"}>
      <a className="wordmark" href="/">
        {site.name}
      </a>
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        onClick={() => setOpenPath(open ? null : location.pathname)}
      >
        {open ? "Close" : "Menu"}
      </button>
      <nav className="site-nav" aria-label="Primary">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to}>
            {link.label}
          </NavLink>
        ))}
        <NavLink to="/shortlist">{kept > 0 ? `Kept ${kept}` : "Kept"}</NavLink>
        <div className="theme-switch" role="group" aria-label="Colour theme">
          <button type="button" aria-pressed={theme === "light"} onClick={() => choose("light")}>
            Light
          </button>
          <button type="button" aria-pressed={theme === "dark"} onClick={() => choose("dark")}>
            Dark
          </button>
        </div>
      </nav>
    </header>
  );
}
