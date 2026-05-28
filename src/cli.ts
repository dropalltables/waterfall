import { DEFAULT_OPTIONS, HELP } from "./constants"
import type { Alignment, ColorChannel, ColorFormat, Options } from "./types"

export function parseArgs(argv: string[]): Options {
  const args = [...argv]
  let filePath: string | undefined
  const options: Omit<Options, "filePath"> = { ...DEFAULT_OPTIONS }

  while (args.length > 0) {
    const arg = args.shift()
    if (arg == null) {
      break
    }

    if (arg === "-h" || arg === "--help") {
      process.stdout.write(`${HELP}\n`)
      process.exit(0)
    }

    if (arg === "--") {
      if (filePath != null) {
        throw new Error("Unexpected argument: --")
      }
      if (args.length !== 1) {
        throw new Error(args.length === 0 ? "Missing file path." : `Unexpected argument: ${args[1]}`)
      }
      filePath = args[0]
      break
    }

    if (!arg.startsWith("-")) {
      if (filePath != null) {
        throw new Error(`Unexpected argument: ${arg}`)
      }
      filePath = arg
      continue
    }

    const value = () => {
      const next = args.shift()
      if (next == null) {
        throw new Error(`Missing value for ${arg}`)
      }
      return next
    }

    switch (arg) {
      case "--sample-rate":
        options.sampleRate = parseInteger(value(), "sample rate", 1, 384000)
        break
      case "--sample-bytes":
        options.sampleBytes = parseSampleBytes(value())
        break
      case "--channels":
        options.channels = parseChannels(value())
        break
      case "--fps":
        options.fps = parseInteger(value(), "fps", 1, 120)
        break
      case "--format":
        options.colorFormat = value()
        break
      case "--alignment":
        options.alignment = parseAlignment(value())
        break
      case "--no-flip-v":
        options.flipVertical = false
        break
      case "--flip-h":
        options.flipHorizontal = true
        break
      case "--no-playhead":
        options.showPlayhead = false
        break
      case "--volume":
        options.volume = parseFloatRange(value(), "volume", 0, 4)
        break
      default:
        throw new Error(`Unknown option: ${arg}`)
    }
  }

  if (filePath == null) {
    throw new Error("Missing file path.")
  }

  return {
    filePath,
    ...options,
  }
}

export function parseColorFormat(value: string): ColorFormat {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    throw new Error("format cannot be empty.")
  }

  const channels = [...trimmed] as ColorChannel[]
  const valid = new Set<ColorChannel>(["r", "R", "g", "G", "b", "B", "w", "W", "x"])
  for (const channel of channels) {
    if (!valid.has(channel)) {
      throw new Error("format only accepts r, g, b, w, uppercase inverted variants, and x.")
    }
  }

  const lower = trimmed.toLowerCase()
  const red = lower.match(/r/g)?.length ?? 0
  const green = lower.match(/g/g)?.length ?? 0
  const blue = lower.match(/b/g)?.length ?? 0
  const white = lower.match(/w/g)?.length ?? 0
  const colorCount = red + green + blue + white

  if (colorCount === 0) {
    throw new Error("format must use at least one color channel.")
  }
  if (white > 0 && red + green + blue > 0) {
    throw new Error("format cannot mix grayscale w/W with RGB channels.")
  }
  if (red > 1 || green > 1 || blue > 1 || white > 1) {
    throw new Error("format can use each color channel at most once.")
  }

  return {
    channels,
    bytesPerPixel: channels.length,
  }
}

function parseInteger(value: string, label: string, min: number, max: number): number {
  if (!/^-?\d+$/.test(value)) {
    throw new Error(`${label} must be an integer.`)
  }

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be between ${min} and ${max}.`)
  }

  return parsed
}

function parseFloatRange(value: string, label: string, min: number, max: number): number {
  if (value.trim() === "") {
    throw new Error(`${label} must be a number.`)
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be between ${min} and ${max}.`)
  }
  return parsed
}

function parseSampleBytes(value: string): 1 | 2 | 3 | 4 {
  const parsed = parseInteger(value, "sample bytes", 1, 4)
  return parsed as 1 | 2 | 3 | 4
}

function parseChannels(value: string): 1 | 2 {
  const parsed = parseInteger(value, "channels", 1, 2)
  if (parsed !== 1 && parsed !== 2) {
    throw new Error("channels must be 1 or 2.")
  }
  return parsed
}

function parseAlignment(value: string): Alignment {
  if (value === "start" || value === "middle" || value === "end") {
    return value
  }
  throw new Error("alignment must be start, middle, or end.")
}
