import type { SVGProps } from "react";

/**
 * beside icon set — 24px grid, 1.9px strokes, round joins.
 * Shapes keep one sharp corner (the speech-bubble corner), echoing the tiles.
 */
const PATHS = {
  feed: (
    <>
      <path d="M4 10a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9.5H6a2 2 0 0 1-2-2z" />
      <path d="M7 4.5h10" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8.2" r="3.3" />
      <path d="M3.2 19.5c.7-3.4 3-5.4 5.8-5.4s5.1 2 5.8 5.4" />
      <path d="M15.4 5.1a3.3 3.3 0 0 1 0 6.2" />
      <path d="M17.6 14.4c1.7.7 2.8 2.4 3.2 5.1" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8.3" r="3.6" />
      <path d="M4.8 20c.8-3.9 3.6-6.2 7.2-6.2s6.4 2.3 7.2 6.2" />
    </>
  ),
  compose: (
    <>
      <path d="M15 4.5 19.5 9 9.5 19H5v-4.5z" />
      <path d="m12.5 7 4.5 4.5" />
      <path d="M14 19.5h5.5" />
    </>
  ),
  comment: (
    <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8z" />
  ),
  thread: (
    <>
      <path d="M3.5 15.5V5.5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H6.5z" />
      <path d="M18.5 8.5h.5a1.5 1.5 0 0 1 1.5 1.5v10.5L17.5 18H11a1.5 1.5 0 0 1-1.5-1.5v-1" />
    </>
  ),
  reply: (
    <>
      <path d="M6 4.5V11a4 4 0 0 0 4 4h9.5" />
      <path d="m15.5 11 4 4-4 4" />
    </>
  ),
  follow: (
    <>
      <circle cx="9.5" cy="8.3" r="3.5" />
      <path d="M3 19.8c.7-3.7 3.3-5.8 6.5-5.8 1.8 0 3.4.7 4.6 1.9" />
      <path d="M18.5 13v7M15 16.5h7" />
    </>
  ),
  following: (
    <>
      <circle cx="9.5" cy="8.3" r="3.5" />
      <path d="M3 19.8c.7-3.7 3.3-5.8 6.5-5.8 1.8 0 3.4.7 4.6 1.9" />
      <path d="m15 17 2.3 2.3 4.2-4.8" />
    </>
  ),
  unfollow: (
    <>
      <circle cx="9.5" cy="8.3" r="3.5" />
      <path d="M3 19.8c.7-3.7 3.3-5.8 6.5-5.8 1.8 0 3.4.7 4.6 1.9" />
      <path d="m16 14 5 5M21 14l-5 5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  arrowLeft: <path d="M19 12H5m6-6-6 6 6 6" />,
  arrowRight: <path d="M5 12h14m-6-6 6 6-6 6" />,
  arrowUp: <path d="M12 19V5m-6 6 6-6 6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 21.5 20h-19z" />
      <path d="M12 10v4.5M12 17.4v.1" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.6v.1" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M6.6 6.9C3.9 8.7 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.9 0 3.5-.6 4.9-1.5M9.9 5.7c.7-.1 1.4-.2 2.1-.2 6 0 9.5 6.5 9.5 6.5s-.7 1.4-2 2.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m4 4 16 16" />
    </>
  ),
  logout: (
    <>
      <path d="M10 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" />
      <path d="m16 16 4-4-4-4M20 12H10" />
    </>
  ),
  login: (
    <>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="m10 16 4-4-4-4M14 12H3.5" />
    </>
  ),
  sparkle: (
    <>
      <path d="M11 3.5c.6 4.6 2.3 6.4 6.9 7-4.6.6-6.3 2.4-6.9 7-.6-4.6-2.3-6.4-6.9-7 4.6-.6 6.3-2.4 6.9-7z" />
      <path d="M19 15.5v5M16.5 18h5" />
    </>
  ),
  refresh: (
    <>
      <path d="M19.8 11.2A8 8 0 1 0 17.6 17" />
      <path d="M20 4.5v6.7h-6.7" />
    </>
  ),
  at: (
    <>
      <circle cx="12" cy="12" r="3.8" />
      <path d="M15.8 12v1.3a2.6 2.6 0 0 0 5.2 0V12a9 9 0 1 0-3.6 7.2" />
    </>
  ),
  lock: (
    <>
      <path d="M5 12a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8H7a2 2 0 0 1-2-2z" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </>
  ),
  mail: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12H5a2 2 0 0 1-2-2z" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </>
  ),
  calendar: (
    <>
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13H6a2 2 0 0 1-2-2z" />
      <path d="M4 10.5h16M8.5 3v4M15.5 3v4" />
    </>
  ),
  grid: (
    <path d="M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z" />
  ),
  quote: (
    <path d="M10 6.5C6.6 7.6 5 10 5 13.5V18h5v-5H7.6c.1-2 1.1-3.3 3-4zM19 6.5c-3.4 1.1-5 3.5-5 7V18h5v-5h-2.4c.1-2 1.1-3.3 3-4z" />
  ),
  external: (
    <>
      <path d="M14 4h6v6M20 4l-8.5 8.5" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </>
  ),
  keyboard: (
    <>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2z" />
      <path d="M7 10h.1M10.5 10h.1M14 10h.1M17 10h.1M8 14h8" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  label,
  strokeWidth = 1.9,
  ...rest
}: {
  name: IconName;
  size?: number;
  label?: string;
  strokeWidth?: number;
} & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
