'use client';

interface IconProps {
  name: string;
  size?: number;
}

export default function Icon({ name, size = 16 }: IconProps) {
  const icons: Record<string, React.ReactNode> = {
    home: <path d="M3 9l7-6 7 6v8a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />,
    timeline: <><path d="M3 7h14M3 12h14M3 17h14" /><circle cx="7" cy="7" r="1.5" fill="currentColor"/><circle cx="13" cy="12" r="1.5" fill="currentColor"/><circle cx="9" cy="17" r="1.5" fill="currentColor"/></>,
    calendar: <><rect x="3" y="4" width="14" height="14" rx="2" /><path d="M3 8h14M7 2v4M13 2v4" /></>,
    list: <><path d="M3 5h14M3 10h14M3 15h14" /></>,
    search: <><circle cx="9" cy="9" r="6" /><path d="M14 14l4 4" /></>,
    repeat: <><path d="M4 7h10l-3-3M16 13H6l3 3" /></>,
    plus: <path d="M10 4v12M4 10h12" />,
    clock: <><circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 2"/></>,
    users: <><circle cx="8" cy="8" r="3"/><path d="M2 17c0-3 3-5 6-5s6 2 6 5M13 9a2.5 2.5 0 000-5M18 17c0-2-1.5-3.5-4-4"/></>,
    floor: <><rect x="3" y="3" width="14" height="14" rx="1"/><path d="M3 10h14M10 3v14"/></>,
    bell: <><path d="M5 8a5 5 0 0110 0v4l2 2H3l2-2V8zM8 17a2 2 0 004 0"/></>,
    settings: <><circle cx="10" cy="10" r="3"/><path d="M10 2v3m0 10v3m8-8h-3m-10 0H2m13.5-5.5l-2 2m-7 7l-2 2m0-11l2 2m7 7l2 2"/></>,
    chevronL: <path d="M12 5l-5 5 5 5" />,
    chevronR: <path d="M8 5l5 5-5 5" />,
    chevronD: <path d="M5 8l5 5 5-5" />,
    x: <path d="M5 5l10 10M15 5l-10 10" />,
    check: <path d="M4 10l4 4 8-8" />,
    dot: <circle cx="10" cy="10" r="3" fill="currentColor"/>,
    tv: <><rect x="3" y="4" width="14" height="10" rx="1"/><path d="M7 17h6"/></>,
    board: <><rect x="2" y="4" width="16" height="10" rx="1"/><path d="M10 14v3M7 17h6"/></>,
    monitor: <><rect x="3" y="4" width="14" height="9" rx="1"/><path d="M8 17h4M10 13v4"/></>,
    video: <><rect x="3" y="6" width="10" height="8" rx="1"/><path d="M13 9l4-2v6l-4-2"/></>,
    mic: <><rect x="8" y="3" width="4" height="8" rx="2"/><path d="M5 9a5 5 0 0010 0M10 14v3"/></>,
    projector: <><rect x="3" y="7" width="14" height="7" rx="1"/><circle cx="13" cy="10.5" r="2"/><path d="M5 14v2m10-2v2"/></>,
    window: <><rect x="4" y="3" width="12" height="14" rx="1"/><path d="M4 10h12M10 3v14"/></>,
    quiet: <><path d="M10 3v14M6 7v6M3 9v2M14 7v6M17 9v2"/></>,
    star: <path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.5L10 14.5 5.1 17.2 6 11.7 2 7.8l5.5-.8L10 2z" />,
    trash: <><path d="M4 6h12M8 6V4a1 1 0 011-1h2a1 1 0 011 1v2M6 6l1 11a1 1 0 001 1h4a1 1 0 001-1l1-11"/></>,
    edit: <><path d="M12 3l5 5-9 9H3v-5l9-9z"/></>,
    arrow: <path d="M4 10h12m-4-4l4 4-4 4"/>,
    user: <><circle cx="10" cy="7" r="3"/><path d="M3 17c0-3 3-5 7-5s7 2 7 5"/></>,
    grid: <><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></>,
    building: <><rect x="4" y="2" width="12" height="16" rx="1"/><path d="M8 6h4M8 10h4M8 14h4M4 18h12"/></>,
    heart: <path d="M10 16s-7-4.5-7-9a4 4 0 018 0 4 4 0 018 0c0 4.5-7 9-7 9z" />,
    heartFilled: <path d="M10 16s-7-4.5-7-9a4 4 0 018 0 4 4 0 018 0c0 4.5-7 9-7 9z" fill="currentColor" />,
    chart: <><path d="M3 15l4-6 4 3 4-8"/><path d="M3 17h14"/></>,
    shield: <><path d="M10 2l7 3v5c0 4-3.5 7-7 8-3.5-1-7-4-7-8V5l7-3z"/></>,
    logout: <><path d="M13 5h4v10h-4M8 13l4-3-4-3M2 10h10"/></>,
    moon: <path d="M17 13a7 7 0 11-9-9 6 6 0 109 9z" />,
    sun: <><circle cx="10" cy="10" r="3.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.9 4.9l1.4 1.4M13.7 13.7l1.4 1.4M4.9 15.1l1.4-1.4M13.7 6.3l1.4-1.4"/></>,
    image: <><rect x="3" y="3" width="14" height="14" rx="2"/><circle cx="8" cy="8" r="2"/><path d="M21 15l-5-5L5 21"/></>,
    upload: <><path d="M10 14V4M5 9l5-5 5 5"/><path d="M3 17h14"/></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {icons[name] ?? null}
    </svg>
  );
}
