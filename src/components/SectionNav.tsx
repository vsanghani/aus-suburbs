import { registry } from "../metrics/registry";
import { formatNumber } from "../lib/format";
import { useActiveSection } from "../lib/useActiveSection";

const ids = registry.map((section) => section.id);

export function SectionNav({ score }: { score: number | null }) {
  const active = useActiveSection(ids);
  return (
    <nav className="section-nav" aria-label="Page sections">
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
