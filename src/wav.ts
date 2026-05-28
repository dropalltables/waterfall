import type { Options } from "./types"

export function makeWav(bytes: Uint8Array, options: Options): Uint8Array {
  const blockAlign = options.channels * options.sampleBytes
  const paddedLength = Math.ceil(bytes.length / blockAlign) * blockAlign
  const dataLength = paddedLength
  const headerLength = 44
  const wav = new Uint8Array(headerLength + dataLength)
  const view = new DataView(wav.buffer)

  writeAscii(wav, 0, "RIFF")
  view.setUint32(4, 36 + dataLength, true)
  writeAscii(wav, 8, "WAVE")
  writeAscii(wav, 12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, options.channels, true)
  view.setUint32(24, options.sampleRate, true)
  view.setUint32(28, options.sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, options.sampleBytes * 8, true)
  writeAscii(wav, 36, "data")
  view.setUint32(40, dataLength, true)
  wav.set(bytes, headerLength)
  wav.fill(options.sampleBytes === 1 ? 128 : 0, headerLength + bytes.length)

  return wav
}

function writeAscii(buffer: Uint8Array, offset: number, value: string): void {
  for (let i = 0; i < value.length; i += 1) {
    buffer[offset + i] = value.charCodeAt(i)
  }
}
