/**
 * themes.js — built-in themes + custom theme system
 * Themes set CSS custom properties directly on <html> via style attribute.
 * The [data-theme] attribute is kept for backward compat but theme vars win.
 */

export const THEMES = [
  // ── Row 1: Light/Dark time-of-day themes ─────────────────────────────────
  {
    id: 'light',
    name: 'Light',
    tamil: 'பகல்',
    dark: false,
    vars: {
      '--bg':'#fdfdfd','--bg-alt':'#f7f7f7','--bg-raised':'#efefef','--bg-hover':'#e8e8e8',
      '--border':'#dedede','--border-sub':'#ebebeb',
      '--fg':'#1a1a1a','--fg-2':'#555555','--fg-3':'#747474',
      '--correct':'#1a7a35','--corrected':'#1a4fa8','--wrong':'#c03030','--warn':'#966010',
      '--cursor-bar':'#5254b8','--accent':'#b05020','--accent-dim':'rgba(176,80,32,.09)',
      '--hint-fill':'rgba(40,80,220,.42)','--shift-fill':'rgba(180,128,18,.42)',
    },
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin',
    tamil: 'மாலை',
    dark: true,
    vars: {
      '--bg':'#1e1e2e','--bg-alt':'#181825','--bg-raised':'#313244','--bg-hover':'#45475a',
      '--border':'#585b70','--border-sub':'#292940',
      '--fg':'#cdd6f4','--fg-2':'#bac2de','--fg-3':'#82869a',
      '--correct':'#a6e3a1','--corrected':'#89dceb','--wrong':'#f38ba8','--warn':'#fab387',
      '--cursor-bar':'#b4befe','--accent':'#cba6f7','--accent-dim':'rgba(203,166,247,.12)',
      '--hint-fill':'rgba(180,190,254,.4)','--shift-fill':'rgba(250,179,135,.35)',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    tamil: 'இரவு',
    dark: true,
    vars: {
      '--bg':'#141414','--bg-alt':'#1c1c1c','--bg-raised':'#242424','--bg-hover':'#2c2c2c',
      '--border':'#333333','--border-sub':'#222222',
      '--fg':'#e8e3d8','--fg-2':'#888580','--fg-3':'#817e78',
      '--correct':'#6fcb81','--corrected':'#6ba8e0','--wrong':'#e06b6b','--warn':'#c99a50',
      '--cursor-bar':'#9d99d8','--accent':'#c47d56','--accent-dim':'rgba(196,125,86,.12)',
      '--hint-fill':'rgba(140,150,255,.48)','--shift-fill':'rgba(212,174,80,.46)',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    tamil: 'யாமம்',
    dark: true,
    vars: {
      '--bg':'#0d1117','--bg-alt':'#161b22','--bg-raised':'#21262d','--bg-hover':'#30363d',
      '--border':'#30363d','--border-sub':'#1c2128',
      '--fg':'#e6edf3','--fg-2':'#8b949e','--fg-3':'#737e8c',
      '--correct':'#3fb950','--corrected':'#58a6ff','--wrong':'#f85149','--warn':'#d29922',
      '--cursor-bar':'#79c0ff','--accent':'#388bfd','--accent-dim':'rgba(56,139,253,.12)',
      '--hint-fill':'rgba(56,139,253,.4)','--shift-fill':'rgba(210,153,34,.4)',
    },
  },
  {
    id: 'amoled',
    name: 'AMOLED',
    tamil: 'கார்',
    dark: true,
    vars: {
      '--bg':'#000000','--bg-alt':'#080808','--bg-raised':'#111111','--bg-hover':'#1a1a1a',
      '--border':'#282828','--border-sub':'#141414',
      '--fg':'#ffffff','--fg-2':'#aaaaaa','--fg-3':'#757575',
      '--correct':'#00e676','--corrected':'#40c4ff','--wrong':'#ff5252','--warn':'#ffab40',
      '--cursor-bar':'#ea80fc','--accent':'#ff6d00','--accent-dim':'rgba(255,109,0,.15)',
      '--hint-fill':'rgba(234,128,252,.4)','--shift-fill':'rgba(255,171,64,.4)',
    },
  },
  // ── Row 2: Named editor themes ────────────────────────────────────────────
  {
    id: 'solarized',
    name: 'Solarized',
    tamil: 'மரகதம்',
    dark: true,
    vars: {
      '--bg':'#002b36','--bg-alt':'#073642','--bg-raised':'#094554','--bg-hover':'#0d5468',
      '--border':'#2a6270','--border-sub':'#063140',
      '--fg':'#fdf6e3','--fg-2':'#93a1a1','--fg-3':'#78929a',
      '--correct':'#859900','--corrected':'#268bd2','--wrong':'#dc322f','--warn':'#b58900',
      '--cursor-bar':'#6c71c4','--accent':'#cb4b16','--accent-dim':'rgba(203,75,22,.15)',
      '--hint-fill':'rgba(108,113,196,.45)','--shift-fill':'rgba(181,137,0,.45)',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    tamil: 'மாயம்',
    dark: true,
    vars: {
      '--bg':'#282a36','--bg-alt':'#21222c','--bg-raised':'#343746','--bg-hover':'#424560',
      '--border':'#44475a','--border-sub':'#2d2f42',
      '--fg':'#f8f8f2','--fg-2':'#abb2bf','--fg-3':'#8491b8',
      '--correct':'#50fa7b','--corrected':'#8be9fd','--wrong':'#ff5555','--warn':'#f1fa8c',
      '--cursor-bar':'#bd93f9','--accent':'#ff79c6','--accent-dim':'rgba(255,121,198,.12)',
      '--hint-fill':'rgba(189,147,249,.45)','--shift-fill':'rgba(241,250,140,.35)',
    },
  },
  {
    id: 'rose',
    name: 'Rose Pine',
    tamil: 'செவ்வந்தி',
    dark: true,
    vars: {
      '--bg':'#191724','--bg-alt':'#1f1d2e','--bg-raised':'#26233a','--bg-hover':'#2a2640',
      '--border':'#403d52','--border-sub':'#21202e',
      '--fg':'#e0def4','--fg-2':'#908caa','--fg-3':'#827e9c',
      '--correct':'#31748f','--corrected':'#9ccfd8','--wrong':'#eb6f92','--warn':'#f6c177',
      '--cursor-bar':'#c4a7e7','--accent':'#eb6f92','--accent-dim':'rgba(235,111,146,.12)',
      '--hint-fill':'rgba(196,167,231,.4)','--shift-fill':'rgba(246,193,119,.35)',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    tamil: 'துருவம்',
    dark: true,
    vars: {
      '--bg':'#2e3440','--bg-alt':'#3b4252','--bg-raised':'#434c5e','--bg-hover':'#4c566a',
      '--border':'#4c566a','--border-sub':'#373e4d',
      '--fg':'#eceff4','--fg-2':'#d8dee9','--fg-3':'#929db1',
      '--correct':'#a3be8c','--corrected':'#88c0d0','--wrong':'#bf616a','--warn':'#ebcb8b',
      '--cursor-bar':'#b48ead','--accent':'#5e81ac','--accent-dim':'rgba(94,129,172,.15)',
      '--hint-fill':'rgba(180,142,173,.45)','--shift-fill':'rgba(235,203,139,.4)',
    },
  },
  {
    id: 'paper',
    name: 'Paper',
    tamil: 'ஏடு',
    dark: false,
    vars: {
      '--bg':'#f4f0e8','--bg-alt':'#ede9e0','--bg-raised':'#e4dfd3','--bg-hover':'#d9d3c5',
      '--border':'#c8c0b0','--border-sub':'#ddd8cc',
      '--fg':'#2c2416','--fg-2':'#6b5e4a','--fg-3':'#7a6b54',
      '--correct':'#3a7c3a','--corrected':'#2a5fa8','--wrong':'#b83030','--warn':'#8a6010',
      '--cursor-bar':'#6050b8','--accent':'#c45a28','--accent-dim':'rgba(196,90,40,.10)',
      '--hint-fill':'rgba(96,80,184,.4)','--shift-fill':'rgba(138,96,16,.4)',
    },
  },
  // ── Row 3: Tamil Sangam Tinai palettes (in tinai order) ──────────────────
  {
    id: 'kurinji',
    name: 'Kurinji',
    tamil: 'குறிஞ்சி',
    dark: true,
    vars: {
      '--bg':'#1a1625','--bg-alt':'#211c32','--bg-raised':'#2d2540','--bg-hover':'#382e50',
      '--border':'#4a4060','--border-sub':'#251f35',
      '--fg':'#e8e0f5','--fg-2':'#b09fd4','--fg-3':'#877ba7',
      '--correct':'#9a7fd4','--corrected':'#7eb8e0','--wrong':'#e87d9b','--warn':'#d4aa72',
      '--cursor-bar':'#c4a0e8','--accent':'#7c5cbf','--accent-dim':'rgba(124,92,191,.15)',
      '--hint-fill':'rgba(196,160,232,.45)','--shift-fill':'rgba(212,170,114,.4)',
    },
  },
  {
    id: 'mullai',
    name: 'Mullai',
    tamil: 'முல்லை',
    dark: true,
    vars: {
      '--bg':'#1c2318','--bg-alt':'#222b1e','--bg-raised':'#2a3320','--bg-hover':'#333e28',
      '--border':'#445535','--border-sub':'#1e2818',
      '--fg':'#e8efe0','--fg-2':'#94a880','--fg-3':'#789060',
      '--correct':'#7ab870','--corrected':'#70b8b0','--wrong':'#c85040','--warn':'#c8a850',
      '--cursor-bar':'#a8c880','--accent':'#5a8a4a','--accent-dim':'rgba(90,138,74,.15)',
      '--hint-fill':'rgba(168,200,128,.45)','--shift-fill':'rgba(200,168,80,.4)',
    },
  },
  {
    id: 'marutham',
    name: 'Marutham',
    tamil: 'மருதம்',
    dark: true,
    vars: {
      '--bg':'#0e1a10','--bg-alt':'#142018','--bg-raised':'#1c2c1e','--bg-hover':'#253826',
      '--border':'#3a5a3e','--border-sub':'#112014',
      '--fg':'#dff0d8','--fg-2':'#8ab890','--fg-3':'#5c8c64',
      '--correct':'#6abf6e','--corrected':'#6bbfbf','--wrong':'#d45050','--warn':'#c8902a',
      '--cursor-bar':'#a0d060','--accent':'#c04040','--accent-dim':'rgba(192,64,64,.15)',
      '--hint-fill':'rgba(106,191,110,.4)','--shift-fill':'rgba(200,144,42,.4)',
    },
  },
  {
    id: 'neytal',
    name: 'Neytal',
    tamil: 'நெய்தல்',
    dark: true,
    vars: {
      '--bg':'#0d1b2a','--bg-alt':'#132336','--bg-raised':'#1a2e42','--bg-hover':'#213850',
      '--border':'#2e4a60','--border-sub':'#101e2e',
      '--fg':'#d0e8f5','--fg-2':'#7ab0cc','--fg-3':'#5489a8',
      '--correct':'#4a9ebf','--corrected':'#6bbfbf','--wrong':'#e8834a','--warn':'#d4aa72',
      '--cursor-bar':'#7ab8d4','--accent':'#4a9ebf','--accent-dim':'rgba(74,158,191,.15)',
      '--hint-fill':'rgba(122,184,212,.45)','--shift-fill':'rgba(212,170,114,.4)',
    },
  },
  {
    id: 'palai',
    name: 'Palai',
    tamil: 'பாலை',
    dark: true,
    vars: {
      '--bg':'#1a1208','--bg-alt':'#221808','--bg-raised':'#2e1f0a','--bg-hover':'#3c2810',
      '--border':'#5a3e18','--border-sub':'#1e1406',
      '--fg':'#f5dfa0','--fg-2':'#c8a050','--fg-3':'#9f773b',
      '--correct':'#b8a050','--corrected':'#70a8b0','--wrong':'#c84020','--warn':'#d4840a',
      '--cursor-bar':'#d4a050','--accent':'#d4840a','--accent-dim':'rgba(212,132,10,.15)',
      '--hint-fill':'rgba(212,160,80,.45)','--shift-fill':'rgba(200,160,80,.4)',
    },
  },
  // ── Row 4: Custom ─────────────────────────────────────────────────────────
  {
    id: 'custom',
    name: 'Custom',
    tamil: 'விருப்பம்',
    dark: true,
    vars: null, // loaded from storage
  },
];

export const THEME_CUSTOMIZABLE_VARS = [
  { key: '--bg',         label: 'Background' },
  { key: '--bg-alt',     label: 'Surface' },
  { key: '--bg-raised',  label: 'Raised' },
  { key: '--fg',         label: 'Text' },
  { key: '--fg-2',       label: 'Text secondary' },
  { key: '--fg-3',       label: 'Text muted' },
  { key: '--accent',     label: 'Accent' },
  { key: '--correct',    label: 'Correct' },
  { key: '--wrong',      label: 'Wrong' },
  { key: '--warn',       label: 'Warning' },
  { key: '--cursor-bar', label: 'Cursor' },
  { key: '--border',     label: 'Border' },
  { key: '--font-ui',    label: 'UI Font',    type: 'font',
    options: [
      { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
      { label: 'Monospace',      value: 'monospace' },
      { label: 'Georgia Serif',  value: 'Georgia, serif' },
    ],
  },
  { key: '--font-tamil', label: 'Tamil Font', type: 'font',
    options: [
      { label: 'Noto Sans Tamil', value: "'Noto Sans Tamil', 'Latha', sans-serif" },
      { label: 'Latha',           value: 'Latha, sans-serif' },
    ],
  },
];

/* ── Colour helpers (WCAG contrast; lightness-only nudges) ─────────────── */
function parseColor(c) {
  if (typeof c !== 'string') return null;
  c = c.trim();
  let m = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  }
  m = c.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  return m ? [+m[1], +m[2], +m[3]] : null;
}
function relLum([r, g, b]) {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const la = relLum(a), lb = relLum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}
function hslToRgb([h, s, l]) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const hue = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [hue(h + 1 / 3), hue(h), hue(h - 1 / 3)].map(v => Math.round(v * 255));
}
const toHex = rgb => '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');

/** True when a colour is dark (relative luminance < 0.5). */
function isDarkColor(c) {
  const rgb = parseColor(c);
  return rgb ? relLum(rgb) < 0.5 : true;
}

/**
 * Nudge `fg` lightness (hue/saturation preserved) until it reaches `min`:1
 * contrast against every surface in `surfaces`. Used for --fg-3, which is drawn
 * on both --bg and the navbar / tab-bar surface (--bg-alt).
 */
function ensureContrast(fg, surfaces, min) {
  const f = parseColor(fg);
  const bgs = surfaces.map(parseColor).filter(Boolean);
  if (!f || !bgs.length) return fg;
  const ok = rgb => bgs.every(b => contrast(rgb, b) >= min);
  if (ok(f)) return fg;
  const [h, s, l] = rgbToHsl(f);
  // Move away from the surfaces: lighter on dark themes, darker on light ones.
  const dir = bgs.every(b => relLum(b) < 0.5) ? 1 : -1;
  for (let step = 1; step <= 100; step++) {
    const rgb = hslToRgb([h, s, Math.min(1, Math.max(0, l + dir * step * 0.005))]);
    if (ok(rgb)) return toHex(rgb);
  }
  return fg;
}

/** Apply a theme by setting CSS vars directly on <html>. */
export function applyTheme(themeId, customVars) {
  const html = document.documentElement;
  const darkTheme = THEMES.find(t => t.id === 'dark');
  let theme = THEMES.find(t => t.id === themeId) ?? darkTheme;

  // For custom theme, merge stored vars
  const vars = theme.id === 'custom'
    ? (customVars ?? darkTheme.vars)
    : theme.vars;

  // Clear any vars left by previous themes (set all known vars to empty first)
  const allKeys = [
    '--bg','--bg-alt','--bg-raised','--bg-hover',
    '--border','--border-sub',
    '--fg','--fg-2','--fg-3',
    '--correct','--corrected','--wrong','--warn',
    '--cursor-bar','--accent','--accent-dim',
    '--hint-fill','--shift-fill',
    '--font-ui','--font-tamil','--font-logo',
  ];
  allKeys.forEach(k => html.style.removeProperty(k));

  // Custom theme: derive dark/light from the --bg luminance (was hard-coded
  // dark:true, which made a light custom theme render a white-on-white keyboard).
  // Mutating the THEMES entry keeps syncThemeIcon() etc. consistent.
  if (theme.id === 'custom') theme.dark = isDarkColor(vars['--bg']);

  // Apply new theme vars
  Object.entries(vars).forEach(([k, v]) => html.style.setProperty(k, v));

  // --fg-3 is used on --bg, on the navbar / tab-bar surface (--bg-alt) and on
  // raised surfaces such as key-panel chips and buttons (--bg-raised):
  // guarantee >= 4.55:1 on all three (WCAG AA 4.5:1 with a small margin).
  if (vars['--fg-3']) {
    html.style.setProperty('--fg-3',
      ensureContrast(vars['--fg-3'], [vars['--bg'], vars['--bg-alt'] ?? vars['--bg'], vars['--bg-raised'] ?? vars['--bg']], 4.55));
  }

  // data-theme drives SVG keyboard and focus-overlay color overrides
  html.setAttribute('data-theme', theme.dark ? 'dark' : 'light');
}
