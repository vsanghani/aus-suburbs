import type { KeyboardEvent } from "react";

function nextIndex(key: string, current: number, length: number): number | null {
  if (key === "ArrowRight" || key === "ArrowDown") return (current + 1) % length;
  if (key === "ArrowLeft" || key === "ArrowUp") return (current - 1 + length) % length;
  if (key === "Home") return 0;
  if (key === "End") return length - 1;
  return null;
}

export function FilterPills({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string; labelLong?: string }[];
  onChange: (id: string) => void;
}) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.id === value),
  );

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (options.length === 0) return;
    const index = options.findIndex((option) => option.id === value);
    const current = index < 0 ? 0 : index;
    const next = nextIndex(event.key, current, options.length);
    if (next == null) return;
    event.preventDefault();
    const option = options[next];
    if (!option) return;
    onChange(option.id);
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons[next]?.focus();
  }

  return (
    <div
      className="pills"
      role="radiogroup"
      aria-label={label}
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
    >
      {options.map((option, index) => {
        const selected = option.id === value;
        const tabbable =
          selected || (index === selectedIndex && !options.some((item) => item.id === value));
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.labelLong}
            className="pill"
            tabIndex={tabbable ? 0 : -1}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
