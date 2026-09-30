#!/bin/bash
# Formats the file Claude just wrote, so nobody runs `bun run format` by hand.
# Receives PostToolUse JSON on stdin.
#
# Never blocks: this is a formatter, not a gate. biome.json already excludes
# styles.css and routeTree.gen.ts, and --no-errors-on-unmatched keeps those
# (and markdown, JSON, anything Biome does not handle) quiet.

FILE_PATH=$(jq -r '.tool_response.filePath // .tool_input.file_path // empty' 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Run from the repo root so biome.json is the config that applies.
cd "$CLAUDE_PROJECT_DIR" || exit 0

bun biome check --write \
  --files-ignore-unknown=true \
  --no-errors-on-unmatched \
  "$FILE_PATH" 2>/dev/null

exit 0
