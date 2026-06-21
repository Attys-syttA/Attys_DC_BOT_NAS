#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

info() {
  echo "==> $*"
}

cd "$ROOT_DIR"

info "Checking Linux toolchain"
NODE_BIN="$(command -v node || true)"
NPM_BIN="$(command -v npm || true)"

[[ -n "$NODE_BIN" ]] || fail "node was not found. Install Node.js 20+ inside the Linux distribution."
[[ -n "$NPM_BIN" ]] || fail "npm was not found. Install npm inside the Linux distribution."

case "$NODE_BIN" in
  /mnt/*|/cygdrive/*)
    fail "node resolves to a Windows path ($NODE_BIN). Disable WSL Windows PATH inheritance or install Linux Node.js."
    ;;
esac

case "$NPM_BIN" in
  /mnt/*|/cygdrive/*)
    fail "npm resolves to a Windows path ($NPM_BIN). Disable WSL Windows PATH inheritance or install Linux npm."
    ;;
esac

NODE_MAJOR="$(node -p "Number(process.versions.node.split('.')[0])")"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  fail "Node.js 20+ is required. Current: $(node --version)"
fi

echo "node: $(node --version) at $NODE_BIN"
echo "npm:  $(npm --version) at $NPM_BIN"

info "Checking scripts and Python sources"
bash -n install.sh
bash -n linux-start.sh
python3 - <<'PY'
from pathlib import Path

for source_path in [
    Path("tray/codex_tray.py"),
    Path("tray/codex_control_panel.py"),
]:
    compile(source_path.read_text(encoding="utf-8"), str(source_path), "exec")
PY

info "Checking launcher read-only commands"
./install.sh --help >/dev/null
./linux-start.sh --status >/dev/null

info "Installing dependencies and running project validation"
npm ci
npm run typecheck
npm test
npm run build
npm run check
npm run safe-update:status

info "Linux WSL acceptance completed"
