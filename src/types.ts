export type Alignment = "start" | "middle" | "end"

export type Options = {
  filePath: string
  sampleRate: number
  sampleBytes: 1 | 2 | 3 | 4
  channels: 1 | 2
  speed: number | "auto"
  fps: number
  colorFormat: string
  alignment: Alignment
  flipVertical: boolean
  flipHorizontal: boolean
  showPlayhead: boolean
  volume: number
}

export type PcmFormat = {
  sampleRate: number
  sampleBytes: 1 | 2 | 3 | 4
  channels: 1 | 2
}

export type ColorChannel = "r" | "R" | "g" | "G" | "b" | "B" | "w" | "W" | "x"

export type ColorFormat = {
  channels: ColorChannel[]
  bytesPerPixel: number
}

export type InputFile = {
  bytes: Uint8Array
  absolutePath: string
}
