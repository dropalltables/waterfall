import { MAX_SAMPLE_RATE } from "./constants"
import type { Options, PcmFormat } from "./types"
import { readWavByteRate } from "./wav"

/** The format handed to the audio engine: the --sample-rate scaled by --speed. */
export function playbackFormat(options: Options, bytes: Uint8Array): PcmFormat {
  const speed = options.speed === "auto" ? autoSpeed(options, bytes) : options.speed
  const sampleRate = Math.round(options.sampleRate * speed)
  if (sampleRate < 1 || sampleRate > MAX_SAMPLE_RATE) {
    throw new Error(`sample rate x speed must be between 1 and ${MAX_SAMPLE_RATE} Hz, got ${sampleRate} Hz.`)
  }

  return {
    sampleRate,
    sampleBytes: options.sampleBytes,
    channels: options.channels,
  }
}

function autoSpeed(options: Options, bytes: Uint8Array): number {
  const byteRate = readWavByteRate(bytes)
  if (byteRate == null) {
    return 1
  }
  return byteRate / (options.sampleRate * options.channels * options.sampleBytes)
}
