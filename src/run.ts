import { Audio, createCliRenderer, type CliRenderer, type KeyEvent } from "@opentui/core"
import { parseArgs, parseColorFormat } from "./cli"
import { BACKGROUND_COLOR } from "./constants"
import { clamp } from "./format"
import { readInputFile } from "./input-file"
import { PlaybackClock } from "./playback-clock"
import { RawAudioPlayer } from "./raw-audio-player"
import { WaterfallView } from "./waterfall-view"

export async function run(): Promise<void> {
  const options = parseArgs(Bun.argv.slice(2))
  const colorFormat = parseColorFormat(options.colorFormat)
  const { bytes, absolutePath } = await readInputFile(options.filePath)
  const frameBytes = options.sampleRate * options.channels * options.sampleBytes
  const durationMs = Math.max(1, (bytes.length / frameBytes) * 1000)
  const audio = Audio.create({
    autoStart: false,
    sampleRate: options.sampleRate,
    playbackChannels: options.channels,
  })
  let renderer: CliRenderer | null = null
  let player: RawAudioPlayer | null = null
  let cleanedUp = false
  let audioErrorMessage: string | null = null

  const cleanup = () => {
    if (cleanedUp) {
      return
    }
    cleanedUp = true
    if (player != null) {
      player.dispose()
    } else {
      audio.dispose()
    }
  }

  try {
    audio.on("error", (error, context) => {
      if (context.action !== "stopVoice") {
        audioErrorMessage = `${context.action}: ${error.message}`
      }
    })

    if (!audio.start()) {
      throw new Error("No playback device is available.")
    }

    renderer = await createCliRenderer({
      exitOnCtrlC: true,
      targetFps: options.fps,
      maxFps: Math.max(options.fps, 60),
      consoleMode: "disabled",
      backgroundColor: BACKGROUND_COLOR,
    })

    const activeRenderer = renderer
    const clock = new PlaybackClock(durationMs)
    const view = new WaterfallView(activeRenderer, bytes, colorFormat, options, durationMs, absolutePath)
    player = new RawAudioPlayer(audio, bytes, options, options.volume)
    const activePlayer = player

    const stopWithError = (message: string) => {
      audioErrorMessage = message
      clock.pause()
      activePlayer.stop()
    }

    const playFrom = (positionMs: number): boolean => {
      audioErrorMessage = null
      if (!activePlayer.playFrom(positionMs)) {
        stopWithError("OpenTUI could not start audio playback.")
        return false
      }
      clock.play()
      return true
    }

    const seekTo = (positionMs: number) => {
      const wasPlaying = clock.isPlaying()
      clock.seek(positionMs)

      if (!wasPlaying) {
        return
      }

      if (positionMs >= durationMs) {
        clock.pause()
        activePlayer.markEnded()
        return
      }

      playFrom(positionMs)
    }

    activeRenderer.on("destroy", cleanup)
    process.once("exit", cleanup)

    activeRenderer.keyInput.on("keypress", (key: KeyEvent) => {
      if (key.name === "q" || key.name === "escape") {
        activeRenderer.destroy()
        return
      }

      if (key.name === "space") {
        if (clock.isPlaying()) {
          clock.pause()
          activePlayer.stop()
        } else {
          let position = clock.current()
          if (position >= durationMs) {
            position = 0
            clock.seek(0)
          }
          playFrom(position)
        }
        return
      }

      if (key.name === "r") {
        clock.seek(0)
        playFrom(0)
        return
      }

      if (key.name === "left") {
        seekTo(clamp(clock.current() - 5000, 0, durationMs))
        return
      }

      if (key.name === "right") {
        seekTo(clamp(clock.current() + 5000, 0, durationMs))
        return
      }

      if (key.name === ",") {
        seekTo(clamp(clock.current() - 1000 / options.fps, 0, durationMs))
        return
      }

      if (key.name === ".") {
        seekTo(clamp(clock.current() + 1000 / options.fps, 0, durationMs))
        return
      }

      if (key.name === "up") {
        activePlayer.setVolume(clamp(activePlayer.getVolume() + 0.1, 0, 4))
        return
      }

      if (key.name === "down") {
        activePlayer.setVolume(clamp(activePlayer.getVolume() - 0.1, 0, 4))
      }
    })

    if (!playFrom(0)) {
      throw new Error(audioErrorMessage ?? "OpenTUI could not start raw file audio playback.")
    }
    activeRenderer.requestLive()
    activeRenderer.start()

    const interval = setInterval(() => {
      const position = clock.current()
      const playing = clock.isPlaying()
      view.render(position, playing, activePlayer.getVolume(), audioErrorMessage)

      if (!playing && position >= durationMs) {
        activePlayer.markEnded()
      }
    }, Math.floor(1000 / options.fps))

    activeRenderer.on("destroy", () => {
      clearInterval(interval)
    })
  } catch (error) {
    renderer?.destroy()
    cleanup()
    throw error
  }
}
