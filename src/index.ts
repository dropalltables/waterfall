#!/usr/bin/env bun

import { HELP } from "./constants"
import { run } from "./run"

try {
  await run()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`waterfall: ${message}\n\n${HELP}\n`)
  process.exit(1)
}
