const paths = {
  search: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z M21 21l-4.3-4.3",
  menu: "M4 7h16 M4 12h16 M4 17h16",
  close: "M6 6l12 12 M18 6 6 18",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z M12 3v2 M12 19v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M3 12h2 M19 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4",
  moon: "M20 14.5A8.5 8.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z",
  arrow: "M5 12h14 M13 6l6 6-6 6",
} as const;

export function Icon({ name }: { name: keyof typeof paths }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d={paths[name]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
