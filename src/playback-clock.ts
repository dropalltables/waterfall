import { clamp } from "./format"

export class PlaybackClock {
  private offsetMs = 0
  private startedAt = 0
  private playing = false

  constructor(private readonly durationMs: number) {}

  play(): void {
    if (this.playing) {
      return
    }
    this.startedAt = performance.now()
    this.playing = true
  }

  pause(): void {
    if (!this.playing) {
      return
    }
    this.offsetMs = this.current()
    this.playing = false
  }

  seek(ms: number): void {
    this.offsetMs = clamp(ms, 0, this.durationMs)
    this.startedAt = performance.now()
  }

  current(): number {
    if (!this.playing) {
      return this.offsetMs
    }
    return clamp(this.offsetMs + performance.now() - this.startedAt, 0, this.durationMs)
  }

  isPlaying(): boolean {
    return this.playing && this.current() < this.durationMs
  }
}
