export function formatBytes(value: number): string {
  const units = ["B", "KiB", "MiB", "GiB"]
  let size = value
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const tenths = Math.floor((ms % 1000) / 100)
  return `${minutes}:${seconds.toString().padStart(2, "0")}.${tenths}`
}

export function formatSpeed(speed: number): string {
  return `${Number(speed.toFixed(2))}x`
}

export function truncate(value: string, width: number): string {
  if (width <= 0) {
    return ""
  }
  if (value.length <= width) {
    return value
  }
  if (width === 1) {
    return "~"
  }
  return `${value.slice(0, width - 1)}~`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
