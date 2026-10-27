import type { KeyboardEvent } from "react";

export function FilterPills({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    if (options.length === 0) return;
    const index = Math.max(
      0,
      options.findIndex((option) => option.id === value),
    );
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = (index + 1) % options.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = (index - 1 + options.length) % options.length;
    } else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else return;
    event.preventDefault();
    const option = options[next];
    if (!option) return;
    onChange(option.id);
    const buttons = event.currentTarget.querySelectorAll("button");
    buttons[next]?.focus();
  }

  return (
    <div className="pills" role="radiogroup" aria-label={label} onKeyDown={onKey}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className="pill"
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
