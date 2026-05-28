# waterfall

binary video and audio player in a tui. inspired by [Binary Waterfall](https://github.com/nimaid/binary-waterfall) by ella jameson.

## requirements

- bun 1.3.14 or newer
- terminal supported by opentui (think ghostty)
- a speaker

## usage

if run as a script:
```sh
bun install
bun run src/index.ts <file> [options]
```

if run as a binary:
```sh
waterfall <file> [options]
```

options:
```text
--sample-rate <hz>      PCM sample rate. Default: 32000
--sample-bytes <1-4>    Bytes per PCM sample. Default: 1
--channels <1|2>        Audio channel count. Default: 1
--fps <1-120>           Render frames per second. Default: 60
--format <spec>         Pixel byte format. Default: bgrx
--alignment <mode>      Playhead alignment: start, middle, end
--no-flip-v             Do not vertically flip the waterfall
--flip-h                Horizontally flip the waterfall
--no-playhead           Hide the playhead row
--volume <0-4>          Playback volume. Default: 0.8
```

Use `--` before the filename if the file path starts with `-`.

## keyboard controls

```text
Space  play/pause
R      restart
Left   back 5 seconds
Right  forward 5 seconds
,      back one frame
.      forward one frame
Up     volume up
Down   volume down
Q/Esc  quit
```

## contributing

```sh
bun install
bun run check
bun run build
```

to build a standalone executable for the current platform:
```sh
bun run build:standalone
```

you may need to sign the resulting binary if you are on mac
```sh
codesign --force --sign - ./waterfall
```

## license

AGPL-3.0-only.