import { Audio } from "@opentui/core"
import type { PcmFormat } from "./types"
import { makeWav } from "./wav"

export class RawAudioPlayer {
  private voice: number | null = null
  private sound: number | null = null
  private disposed = false

  constructor(
    private readonly audio: Audio,
    private readonly bytes: Uint8Array,
    private readonly format: PcmFormat,
    private volume: number,
  ) {
    this.audio.setMasterVolume(volume)
  }

  playFrom(positionMs: number): boolean {
    this.stop()

    const offset = this.byteOffsetForMs(positionMs)
    if (offset >= this.bytes.length) {
      return false
    }

    const wav = makeWav(this.bytes.subarray(offset), this.format)
    const sound = this.audio.loadSound(wav)
    if (sound == null) {
      return false
    }

    const voice = this.audio.play(sound, { volume: 1, loop: false })
    if (voice == null) {
      this.audio.unloadSound(sound)
      return false
    }

    this.sound = sound
    this.voice = voice
    return true
  }

  stop(): void {
    if (this.voice != null) {
      this.audio.stopVoice(this.voice)
      this.voice = null
    }
    if (this.sound != null) {
      this.audio.unloadSound(this.sound)
      this.sound = null
    }
  }

  markEnded(): void {
    this.voice = null
    if (this.sound != null) {
      this.audio.unloadSound(this.sound)
      this.sound = null
    }
  }

  setVolume(volume: number): void {
    this.volume = volume
    this.audio.setMasterVolume(volume)
  }

  getVolume(): number {
    return this.volume
  }

  dispose(): void {
    if (this.disposed) {
      return
    }
    this.disposed = true
    this.stop()
    this.audio.dispose()
  }

  private byteOffsetForMs(positionMs: number): number {
    const blockAlign = this.format.channels * this.format.sampleBytes
    const rawOffset = Math.floor((positionMs / 1000) * this.format.sampleRate * blockAlign)
    return Math.floor(rawOffset / blockAlign) * blockAlign
  }
}
