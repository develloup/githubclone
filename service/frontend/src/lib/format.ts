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
