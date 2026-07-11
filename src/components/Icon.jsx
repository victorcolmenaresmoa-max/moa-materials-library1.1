const paths = {
  library: <><rect x="3" y="3" width="14" height="14" rx="3"/><path d="M7 3v14M11.5 3v14"/></>,
  heart: <path d="M10 17s-6-3.8-6-8.2C4 6.1 5.8 4.5 8 4.5c1.2 0 2.2.5 3 1.5.8-1 1.8-1.5 3-1.5 2.2 0 4 1.6 4 4.3C18 13.2 12 17 12 17h-2Z"/>,
  clock: <><circle cx="10" cy="10" r="7"/><path d="M10 6.5V10l2.7 1.8"/></>,
  chart: <><path d="M4 16V9h3v7H4Zm5 0V4h3v12H9Zm5 0V7h3v9h-3Z"/><path d="M3 17h15"/></>,
  plus: <path d="M10 4v12M4 10h12"/>,
  search: <><circle cx="9" cy="9" r="5.5"/><path d="m13.2 13.2 3.8 3.8"/></>,
  filter: <path d="M3 5h14M6 10h8M8.5 15h3"/>,
  refresh: <><path d="M16.5 8A7 7 0 1 0 17 11"/><path d="m14 4 2.8 4L19 4"/></>,
  download: <><path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5"/><path d="M4 16h12"/></>,
  grid: <><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="12" y="3" width="5" height="5" rx="1"/><rect x="3" y="12" width="5" height="5" rx="1"/><rect x="12" y="12" width="5" height="5" rx="1"/></>,
  list: <><path d="M7 5h10M7 10h10M7 15h10"/><circle cx="3.5" cy="5" r=".8" fill="currentColor" stroke="none"/><circle cx="3.5" cy="10" r=".8" fill="currentColor" stroke="none"/><circle cx="3.5" cy="15" r=".8" fill="currentColor" stroke="none"/></>,
  chevronDown: <path d="m5 8 5 5 5-5"/>,
  external: <><path d="M11 4h5v5M16 4l-7 7"/><path d="M14 11v5H4V6h5"/></>,
  more: <><circle cx="4" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="10" r="1" fill="currentColor" stroke="none"/></>,
  edit: <><path d="m4 14-.5 3 3-.5L15 8 12 5 4 14Z"/><path d="m11.5 5.5 3 3"/></>,
  copy: <><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M13 7V4H4v9h3"/></>,
  trash: <><path d="M4 6h12M8 3h4M6 6l.7 11h6.6L14 6"/><path d="M9 9v5M11 9v5"/></>,
  eye: <><path d="M2.5 10s2.7-5 7.5-5 7.5 5 7.5 5-2.7 5-7.5 5-7.5-5-7.5-5Z"/><circle cx="10" cy="10" r="2.2"/></>,
  close: <path d="m5 5 10 10M15 5 5 15"/>,
  video: <><rect x="3" y="4" width="14" height="12" rx="3"/><path d="m8 7 5 3-5 3V7Z"/></>,
  image: <><rect x="3" y="3" width="14" height="14" rx="3"/><circle cx="8" cy="8" r="1.4"/><path d="m5 15 4-4 2.5 2.5 1.7-1.7L17 15"/></>,
  pdf: <><path d="M6 2.8h6l4 4V17H6V2.8Z"/><path d="M12 3v4h4M8 11h6M8 14h4"/></>,
  game: <><path d="M6 7h8a4 4 0 0 1 3.7 5.5l-1 2.4a2 2 0 0 1-3.3.7L12 14h-4l-1.4 1.6a2 2 0 0 1-3.3-.7l-1-2.4A4 4 0 0 1 6 7Z"/><path d="M6 10v4M4 12h4M13.5 11.5h.01M15.5 13.5h.01"/></>,
  file: <><path d="M5 3h6l4 4v10H5V3Z"/><path d="M11 3v4h4"/></>,
  star: <path d="m10 2.8 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 8l5-.7L10 2.8Z"/>,
  users: <><circle cx="7" cy="7" r="3"/><circle cx="14" cy="8" r="2.4"/><path d="M2.5 17c.4-4 2.1-6 5-6s4.7 2 5 6M12 12c3 0 4.8 1.6 5.5 5"/></>,
  shield: <path d="M10 2.5 16 5v4.5c0 4-2.5 6.5-6 8-3.5-1.5-6-4-6-8V5l6-2.5Z"/>,
  folder: <path d="M3 5h5l2 2h7v9H3V5Z"/>,
  check: <path d="m4 10 4 4 8-8"/>,
  upload: <><path d="M10 14V4m0 0L6.5 7.5M10 4l3.5 3.5"/><path d="M4 16h12"/></>,
  link: <><path d="m8.5 11.5 3-3"/><path d="M7 14H5.5a3.5 3.5 0 0 1 0-7H8M13 7h1.5a3.5 3.5 0 0 1 0 7H12"/></>,
  info: <><circle cx="10" cy="10" r="7"/><path d="M10 9v5M10 6.5h.01"/></>,
  arrowLeft: <path d="m12.5 4-6 6 6 6"/>,
  sparkles: <><path d="m6 2 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3ZM14 9l1.2 3.8L19 14l-3.8 1.2L14 19l-1.2-3.8L9 14l3.8-1.2L14 9Z"/></>,
}

export default function Icon({ name, size = 20, className = '', filled = false }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.file}
    </svg>
  )
}
