import { useEffect, useRef } from "react";
import { registry } from "../metrics/registry";
import { formatNumber } from "../lib/format";
import { useActiveSection } from "../lib/useActiveSection";

const ids = registry.map((section) => section.id);

export function SectionNav({ score }: { score: number | null }) {
  const active = useActiveSection(ids);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const current = nav.querySelector<HTMLElement>('[aria-current="location"]');
    if (!current) return;
    const navBox = nav.getBoundingClientRect();
    const linkBox = current.getBoundingClientRect();
    const extra = 12;
    if (linkBox.left < navBox.left) nav.scrollLeft -= navBox.left - linkBox.left + extra;
    else if (linkBox.right > navBox.right) nav.scrollLeft += linkBox.right - navBox.right + extra;
  }, [active]);

  return (
    <nav ref={navRef} className="section-nav" aria-label="Page sections">
      {registry.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          aria-current={active === section.id ? "location" : undefined}
        >
          {section.nav}
        </a>
      ))}
      <span className="nav-score">{score == null ? "Unscored" : formatNumber(score)}</span>
    </nav>
  );
}
