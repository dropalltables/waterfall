import type { PcmFormat } from "./types"

export function makeWav(bytes: Uint8Array, format: PcmFormat): Uint8Array {
  const blockAlign = format.channels * format.sampleBytes
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
  view.setUint16(22, format.channels, true)
  view.setUint32(24, format.sampleRate, true)
  view.setUint32(28, format.sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, format.sampleBytes * 8, true)
  writeAscii(wav, 36, "data")
  view.setUint32(40, dataLength, true)
  wav.set(bytes, headerLength)
  wav.fill(format.sampleBytes === 1 ? 128 : 0, headerLength + bytes.length)

  return wav
}

/** Returns null when the bytes do not start with a RIFF/WAVE header. */
export function readWavByteRate(bytes: Uint8Array): number | null {
  if (bytes.length < 12 || readFourCC(bytes, 0) !== "RIFF" || readFourCC(bytes, 8) !== "WAVE") {
    return null
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let offset = 12
  while (offset + 8 <= bytes.length) {
    const chunkLength = view.getUint32(offset + 4, true)
    if (readFourCC(bytes, offset) === "fmt ") {
      if (chunkLength < 16 || offset + 24 > bytes.length) {
        throw new Error("WAV fmt chunk is truncated.")
      }
      const byteRate = view.getUint32(offset + 16, true)
      if (byteRate === 0) {
        throw new Error("WAV header has a byte rate of 0.")
      }
      return byteRate
    }
    // RIFF pads odd-length chunks to an even length.
    offset += 8 + chunkLength + (chunkLength % 2)
  }

  throw new Error("WAV header has no fmt chunk.")
}

function writeAscii(buffer: Uint8Array, offset: number, value: string): void {
  for (let i = 0; i < value.length; i += 1) {
    buffer[offset + i] = value.charCodeAt(i)
  }
}

function readFourCC(buffer: Uint8Array, offset: number): string {
  return String.fromCharCode(...buffer.subarray(offset, offset + 4))
}
