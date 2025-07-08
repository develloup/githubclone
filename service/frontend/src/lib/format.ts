export function formatWithCommas(value: number | string): string {
  const num = typeof value === "string" ? parseInt(value, 10) : value;

  if (!Number.isFinite(num)) return "";

  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatRelativeTime(date: string | Date): string {
  const input = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const seconds = Math.round((now.getTime() - input.getTime()) / 1000)

  if (isNaN(seconds)) return ""

  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "always" })

  const thresholds = {
    minute: 60,
    hour: 3600,
    day: 86400,
    week: 604800,
    month: 2629800,
    year: 31557600,
  }

  if (seconds < thresholds.minute)
    return rtf.format(-seconds, "second")

  if (seconds < thresholds.hour) {
    const minutes = Math.round(seconds / 60)
    return rtf.format(-minutes, "minute")
  }

  const hours = Math.round(seconds / thresholds.hour)
  if (hours === 1) return "last hour"
  if (seconds < thresholds.day)
    return rtf.format(-hours, "hour")

  const days = Math.round(seconds / thresholds.day)
  if (days === 1) return "yesterday"
  if (days < 7)
    return rtf.format(-days, "day")

  const weeks = Math.round(seconds / thresholds.week)
  if (weeks === 1) return "last week"
  if (seconds < thresholds.month)
    return rtf.format(-weeks, "week")

  const months = Math.round(seconds / thresholds.month)
  if (months === 1) return "last month"
  if (seconds < thresholds.year)
    return rtf.format(-months, "month")

  const years = Math.round(seconds / thresholds.year)
  if (years === 1) return "last year"
  return rtf.format(-years, "year")
}


export function formatLicenseLabel(fallback: string, name?: string, key?: string): string {
  const raw = name || key;
  if (!raw) return fallback;

  const endsWithLicense = /\blicense\b$/i.test(raw);
  return endsWithLicense ? raw : `${raw} License`;
}

export function formatNumber(value: number): string {
  const asString = value.toString();

  // If there are ≤ 4 visible digits (without . or -), show them directly
  if (asString.replace(".", "").replace("-", "").length <= 4) {
    return asString;
  }

  const abs = Math.abs(value);

  type FormatUnit = { threshold: number; divisor: number; suffix: string; };
  const units: FormatUnit[] = [
    { threshold: 1000000000000, divisor: 1000000000000, suffix: "t" },
    { threshold: 1000000000, divisor: 1000000000, suffix: "g" },
    { threshold: 1000000, divisor: 1000000, suffix: "m" },
    { threshold: 1000, divisor: 1000, suffix: "k" },
  ];

  for (const unit of units) {
    if (abs >= unit.threshold) {
      const full = (value / unit.divisor).toFixed(1).replace(/\.0$/, "") + unit.suffix;
      if (full.length <= 4) return full;

      const rounded = Math.round(value / unit.divisor).toString() + unit.suffix;
      return rounded.length <= 4 ? rounded : rounded.slice(0, 4);
    }
  }

  // Fallback – e.g. if value < 1000
  return Math.round(value).toString();
}

