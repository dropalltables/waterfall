import {
  BoxRenderable,
  FrameBufferRenderable,
  RGBA,
  TextRenderable,
  type CliRenderer,
} from "@opentui/core"
import { basename } from "node:path"
import { BACKGROUND_COLOR, PANEL_COLOR, PLAYHEAD_COLOR, TEXT_COLOR } from "./constants"
import { formatBytes, formatTime, truncate } from "./format"
import type { ColorFormat, Options } from "./types"

const COLORS = {
  black: RGBA.fromHex(BACKGROUND_COLOR),
  playhead: RGBA.fromHex(PLAYHEAD_COLOR),
}

export class WaterfallView {
  private readonly root: BoxRenderable
  private readonly canvas: FrameBufferRenderable
  private readonly header: TextRenderable
  private readonly footer: TextRenderable
  private canvasWidth = 1
  private canvasHeight = 1

  constructor(
    renderer: CliRenderer,
    private readonly bytes: Uint8Array,
    private readonly colorFormat: ColorFormat,
    private readonly options: Options,
    private readonly durationMs: number,
    private readonly absolutePath: string,
  ) {
    this.root = new BoxRenderable(renderer, {
      id: "waterfall-root",
      width: "100%",
      height: "100%",
      flexDirection: "column",
      backgroundColor: COLORS.black,
    })

    this.header = new TextRenderable(renderer, {
      id: "waterfall-header",
      content: "",
      height: 1,
      fg: TEXT_COLOR,
      bg: PANEL_COLOR,
      selectable: false,
    })

    this.canvas = new FrameBufferRenderable(renderer, {
      id: "waterfall-canvas",
      width: 1,
      height: 1,
      flexGrow: 1,
    })
    this.canvas.width = "100%"

    this.footer = new TextRenderable(renderer, {
      id: "waterfall-footer",
      content: "",
      height: 1,
      fg: TEXT_COLOR,
      bg: PANEL_COLOR,
      selectable: false,
    })

    this.root.add(this.header)
    this.root.add(this.canvas)
    this.root.add(this.footer)
    renderer.root.add(this.root)
  }

  render(positionMs: number, playing: boolean, volume: number, message: string | null): void {
    this.syncDimensions()
    this.drawFrame(positionMs)
    this.drawChrome(positionMs, playing, volume, message)
  }

  private syncDimensions(): void {
    const width = Math.max(1, Math.floor(this.canvas.width))
    const height = Math.max(1, Math.floor(this.canvas.height))
    if (width === this.canvasWidth && height === this.canvasHeight) {
      return
    }

    this.canvasWidth = width
    this.canvasHeight = height
    this.canvas.frameBuffer.resize(width, height)
  }

  private drawFrame(positionMs: number): void {
    const fb = this.canvas.frameBuffer
    const width = this.canvasWidth
    const height = this.canvasHeight
    const rowBytes = width * this.colorFormat.bytesPerPixel
    const totalRows = Math.max(1, Math.ceil(this.bytes.length / rowBytes))
    let startRow = Math.round(totalRows * (positionMs / this.durationMs))

    if (this.options.alignment === "start") {
      startRow -= height - 1
    } else if (this.options.alignment === "middle") {
      startRow -= Math.floor(height / 2)
    }

    for (let screenY = 0; screenY < height; screenY += 1) {
      const visualY = this.options.flipVertical ? height - screenY - 1 : screenY
      for (let screenX = 0; screenX < width; screenX += 1) {
        const visualX = this.options.flipHorizontal ? width - screenX - 1 : screenX
        const fileOffset = (startRow + visualY) * rowBytes + visualX * this.colorFormat.bytesPerPixel
        const [red, green, blue] = this.readPixel(fileOffset)
        const color = RGBA.fromValues(red / 255, green / 255, blue / 255, 1)
        fb.setCell(screenX, screenY, " ", color, color)
      }
    }

    if (this.options.showPlayhead) {
      const playheadY = this.playheadRow(height)
      for (let x = 0; x < width; x += 1) {
        fb.setCell(x, playheadY, " ", COLORS.playhead, COLORS.playhead)
      }
    }
  }

  private readPixel(offset: number): [number, number, number] {
    if (offset < 0 || offset >= this.bytes.length) {
      return [0, 0, 0]
    }

    let red = 0
    let green = 0
    let blue = 0

    for (let i = 0; i < this.colorFormat.channels.length; i += 1) {
      const channel = this.colorFormat.channels[i]
      const value = this.bytes[offset + i] ?? 0
      const mapped = channel !== "x" && channel === channel?.toUpperCase() ? 255 - value : value

      switch (channel) {
        case "r":
        case "R":
          red = mapped
          break
        case "g":
        case "G":
          green = mapped
          break
        case "b":
        case "B":
          blue = mapped
          break
        case "w":
        case "W":
          red = mapped
          green = mapped
          blue = mapped
          break
      }
    }

    return [red, green, blue]
  }

  private playheadRow(height: number): number {
    if (this.options.alignment === "start") {
      return this.options.flipVertical ? 0 : height - 1
    }
    if (this.options.alignment === "end") {
      return this.options.flipVertical ? height - 1 : 0
    }
    return Math.floor((height - 1) / 2)
  }

  private drawChrome(positionMs: number, playing: boolean, volume: number, message: string | null): void {
    const filename = basename(this.absolutePath)
    const status = message == null ? (playing ? "PLAY" : "PAUSE") : "ERROR"
    const percent = this.durationMs === 0 ? 0 : (positionMs / this.durationMs) * 100
    this.header.content = truncate(
      ` ${status}  ${filename}  ${formatBytes(this.bytes.length)}  ` +
        `${formatTime(positionMs)} / ${formatTime(this.durationMs)}  ${percent.toFixed(1)}%`,
      this.canvasWidth,
    )
    const controls =
      ` Space play/pause  R restart  Left/Right seek  Up/Down volume ${volume.toFixed(2)}  ` +
      `Q/Esc quit  ${this.options.sampleRate} Hz ${this.options.channels}ch ${this.options.sampleBytes * 8}-bit ${this.options.colorFormat}`
    const footer = message == null ? controls : ` ${message}  Q/Esc quit`
    this.footer.content = truncate(footer, this.canvasWidth)
  }
}
