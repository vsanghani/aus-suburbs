import { useEffect, useRef, useState } from "react";

export function useActiveSection(ids: readonly string[]): string {
  const key = ids.join("|");
  const idsRef = useRef(ids);
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    idsRef.current = ids;
  }, [ids]);

  useEffect(() => {
    const nodes = idsRef.current
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node instanceof HTMLElement);
    if (nodes.length === 0) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0.1, 0.25, 0.6] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [key]);

  return ids.includes(active) ? active : (ids[0] ?? "");
}
