#!/bin/zsh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
# Reuse calendar-planner local Rust toolchain on this machine
CAL_ROOT="$(cd "$ROOT/../../calendar-planner" && pwd)"
export RUSTUP_HOME="${RUSTUP_HOME:-$CAL_ROOT/.rustup}"
export CARGO_HOME="${CARGO_HOME:-$CAL_ROOT/.cargo}"
export CARGO_TARGET_DIR="$ROOT/src-tauri/target"
# shellcheck disable=SC1091
if [[ -f "$CARGO_HOME/env" ]]; then
  source "$CARGO_HOME/env"
fi
cd "$ROOT"
exec node node_modules/@tauri-apps/cli/tauri.js "$@"
