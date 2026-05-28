import type { Options } from "./types"

export const DEFAULT_OPTIONS = {
  sampleRate: 32000,
  sampleBytes: 1,
  channels: 1,
  fps: 60,
  colorFormat: "bgrx",
  alignment: "middle",
  flipVertical: true,
  flipHorizontal: false,
  showPlayhead: true,
  volume: 0.8,
} satisfies Omit<Options, "filePath">

export const BACKGROUND_COLOR = "#000000"
export const PANEL_COLOR = "#10151c"
export const TEXT_COLOR = "#d8dee9"
export const PLAYHEAD_COLOR = "#ffffff"

export const HELP = `Usage:
  waterfall <file> [options]

Options:
  --sample-rate <hz>      PCM sample rate for raw file audio. Default: 32000
  --sample-bytes <1-4>    Bytes per PCM sample. Default: 1
  --channels <1|2>        Audio channel count. Default: 1
  --fps <1-120>           Render frames per second. Default: 60
  --format <spec>         Pixel byte format. Default: bgrx
                          r/g/b map bytes to RGB, w maps grayscale, uppercase inverts, x skips.
  --alignment <mode>      Playhead alignment: start, middle, end. Default: middle
  --no-flip-v             Do not vertically flip the waterfall.
  --flip-h                Horizontally flip the waterfall.
  --no-playhead           Hide the playhead row.
  --volume <0-4>          OpenTUI audio volume. Default: 0.8
  -h, --help              Show this help.

Keys:
  Space  play/pause
  R      restart
  Left   back 5 seconds
  Right  forward 5 seconds
  ,      back one frame
  .      forward one frame
  Up     volume up
  Down   volume down
  Q/Esc  quit`
