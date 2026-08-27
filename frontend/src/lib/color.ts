function relLuminance(hex: string) {
  const clean = hex.replace("#", "");
  if (clean.length < 6) return 0;
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function idealTextColor(hex: string) {
  return relLuminance(hex) > 0.55 ? "#171717" : "#ffffff";
}

/** Pick `prefer` only when it stays readable on `bg`; otherwise black or white. */
export function contrastOn(bg: string, prefer?: string | null) {
  const fallback = idealTextColor(bg);
  if (!prefer) return fallback;
  return Math.abs(relLuminance(prefer) - relLuminance(bg)) < 0.28
    ? fallback
    : prefer;
}

export function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16) || 0,
    g: parseInt(clean.substring(2, 4), 16) || 0,
    b: parseInt(clean.substring(4, 6), 16) || 0,
  };
}

export function rgbToHex(r: number, g: number, b: number) {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const channel = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}
