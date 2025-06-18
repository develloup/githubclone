export function extractRepoPath(repoUrl: string): string | null {
  try {
    const url = new URL(repoUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length >= 2) {
      return `${segments[0]}/${segments[1]}`;
    }
  } catch (err) {
    console.warn("⚠️ Ungültige URL:", repoUrl, err);
  }
  return null;
}

export function toQualifiedRef(ref: string): string {
  return ref.startsWith("refs/") ? ref : `refs/heads/${ref}`;
}


export function formatNumber(value: number): string {
  const asString = value.toString();

  // Wenn ≤ 4 sichtbare Stellen (ohne . oder -), direkt anzeigen
  if (asString.replace(".", "").replace("-", "").length <= 4) {
    return asString;
  }

  const abs = Math.abs(value);

  type FormatUnit = { threshold: number; divisor: number; suffix: string };
  const units: FormatUnit[] = [
    { threshold: 1_000_000_000_000, divisor: 1_000_000_000_000, suffix: "t" },
    { threshold: 1_000_000_000, divisor: 1_000_000_000, suffix: "g" },
    { threshold: 1_000_000, divisor: 1_000_000, suffix: "m" },
    { threshold: 1_000, divisor: 1_000, suffix: "k" },
  ];

  for (const unit of units) {
    if (abs >= unit.threshold) {
      const full = (value / unit.divisor).toFixed(1).replace(/\.0$/, "") + unit.suffix;
      if (full.length <= 4) return full;

      const rounded = Math.round(value / unit.divisor).toString() + unit.suffix;
      return rounded.length <= 4 ? rounded : rounded.slice(0, 4);
    }
  }

  // Fallback – z. B. wenn value < 1000
  return Math.round(value).toString();
}
