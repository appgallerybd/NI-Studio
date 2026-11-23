const PATHS = {
  plus: 'M12 5v14M5 12h14',
  menu: 'M4 6h16M4 12h16M4 18h16',
  send: 'M12 19V5M5 12l7-7 7 7',
  stop: 'M6 6h12v12H6z',
  copy: 'M9 9h11v11H9zM5 15V5a1 1 0 0 1 1-1h10',
  check: 'M5 12l5 5L20 7',
  download: 'M12 4v12M6 11l6 6 6-6M5 20h14',
  play: 'M7 4l13 8-13 8z',
  x: 'M6 6l12 12M18 6L6 18',
  settings: 'M4 8h8M16 8h4M12 8a2 2 0 1 0 4 0a2 2 0 1 0-4 0M4 16h4M12 16h8M8 16a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  edit: 'M4 20h4L19 9l-4-4L4 16z',
  logout: 'M10 4H5v16h5M15 8l4 4-4 4M19 12H9',
  chevron: 'M6 9l6 6 6-6',
  clip: 'M20 11l-8 8a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7-7',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
