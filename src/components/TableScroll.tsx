import type { ReactNode } from "react";

export function TableScroll({ children, label }: { children: ReactNode; label?: string }) {
  if (!label) return <div className="table-wrap">{children}</div>;
  return (
    <div className="table-wrap is-wide" tabIndex={0} role="region" aria-label={label}>
      {children}
    </div>
  );
}
