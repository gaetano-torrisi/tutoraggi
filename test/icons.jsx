/* eslint-disable */
/* Lucide-style line icons. Single component, 24×24 viewBox, 1.75 stroke. */
const ICON_PATHS = {
  calendar:    'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  users:       'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  user:        'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  briefcase:   'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16M3 7h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z',
  sparkles:    'M9 3l1.5 4.5L15 9l-4.5 1.5L9 15l-1.5-4.5L3 9l4.5-1.5zM18 2l.75 2.25L21 5l-2.25.75L18 8l-.75-2.25L15 5l2.25-.75zM18 14l.75 2.25L21 17l-2.25.75L18 20l-.75-2.25L15 17l2.25-.75z',
  barchart:    'M3 3v18h18M8 17V9M13 17V5M18 17v-7',
  shield:      'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  settings:    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.18.65.45.85.78.2.33.31.7.31 1.08 0 .38-.11.75-.31 1.08-.2.33-.49.6-.85.78z',
  check:       'M20 6L9 17l-5-5',
  checkCircle: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
  x:           'M18 6L6 18M6 6l12 12',
  undo:        'M3 10h10a5 5 0 0 1 0 10h-3M7 6l-4 4 4 4',
  redo:        'M21 10H11a5 5 0 0 0 0 10h3M17 6l4 4-4 4',
  plus:        'M12 5v14M5 12h14',
  search:      'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  upload:      'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  download:    'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  trash:       'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  edit:        'M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z',
  alert:       'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  info:        'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  arrowLeft:   'M19 12H5M12 19l-7-7 7-7',
  arrowRight:  'M5 12h14M12 5l7 7-7 7',
  chevLeft:    'M15 18l-6-6 6-6',
  chevRight:   'M9 18l6-6-6-6',
  chevDown:    'M6 9l6 6 6-6',
  chevUp:      'M18 15l-6-6-6 6',
  menu:        'M3 12h18M3 6h18M3 18h18',
  filter:      'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  sun:         'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
  moon:        'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  logout:      'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  bell:        'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 0 1-3.46 0',
  refresh:     'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  database:    'M12 8c4.97 0 9-1.34 9-3s-4.03-3-9-3-9 1.34-9 3 4.03 3 9 3zM3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6',
  file:        'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6',
  key:         'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
  paperclip:   'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48',
  send:        'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  clipboard:   'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z',
  layers:      'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  clock:       'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  zap:         'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  star:        'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  trending:    'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
  copy:        'M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  external:    'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
  more:        'M12 12.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zM12 19.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zM12 5.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z',
  eye:         'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff:      'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22',
  ai:          'M12 8V4M8 4h8M12 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 18a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v3H4v-3z',
  message:     'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
  archive:     'M21 8v13H3V8M1 3h22v5H1zM10 12h4',
  globe:       'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  shieldCheck: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  arrowDown:   'M12 5v14M19 12l-7 7-7-7',
  arrowUp:     'M12 19V5M5 12l7-7 7 7',
};

window.Icon = function Icon({ name, size = 16, stroke = 1.75, color = "currentColor", style }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style }}>
      <path d={d} />
    </svg>
  );
};

/* eht symbol — flat, line-style. Two orange dots + connector */
window.EhtSymbol = function EhtSymbol({ size = 28, mono = false }) {
  const orange = mono ? "currentColor" : "url(#eht-grad)";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="eht-grad" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#F5A35A" />
          <stop offset="100%" stopColor="#EC7A26" />
        </linearGradient>
      </defs>
      {/* connector blob */}
      <path d="M24 16 Q34 22 34 32 Q34 42 44 48"
        stroke={mono ? "currentColor" : "var(--brand-navy)"} strokeWidth="6" strokeLinecap="round" fill="none"/>
      <circle cx="20" cy="14" r="8" fill={orange} />
      <circle cx="40" cy="50" r="8" fill={orange} />
    </svg>
  );
};

/* App mark — usa il logo fornito (palline).
   variant="color" su sfondi chiari (default), "white" su sfondi scuri,
   "auto" segue il tema corrente (light/dark). */
window.AppMark = function AppMark({ size = 32, variant = "auto", style }) {
  const [theme, setTheme] = React.useState(() =>
    typeof document !== "undefined" ? document.documentElement.getAttribute("data-theme") || "light" : "light"
  );
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const obs = new MutationObserver(() => {
      setTheme(root.getAttribute("data-theme") || "light");
    });
    obs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  const resolved = variant === "auto" ? (theme === "dark" ? "white" : "color") : variant;
  const src = resolved === "white" ? "assets/appmark-white.png" : "assets/appmark-color.png";
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="Logo"
      style={{ display: "block", width: size, height: size, objectFit: "contain", ...style }}
    />
  );
};
