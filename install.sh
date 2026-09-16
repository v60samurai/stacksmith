#!/usr/bin/env bash
# Stacksmith installer for manual and shared setups.
#   ./install.sh codex    -> ~/.agents/skills/stacksmith   (Codex reads this directory natively)
#   ./install.sh claude   -> ~/.claude/skills/stacksmith
#   ./install.sh both     -> ~/.agents/skills/stacksmith once, plus a symlink from ~/.claude/skills/stacksmith (no second copy)
#   ./install.sh status   -> show what is installed where
#   ./install.sh uninstall
# Options: --update (refresh an existing install), --copy (copy files instead of symlinking to this checkout)
# Claude Code users can skip this script: `claude plugin marketplace add <owner>/stacksmith` then `claude plugin install stacksmith@stacksmith`.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$HERE/skills/stacksmith"
AGENTS_DIR="${AGENTS_SKILLS_DIR:-$HOME/.agents/skills}"
CLAUDE_DIR="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
MODE="${1:-}"; UPDATE=0; COPY=0
for a in "${@:2}"; do case "$a" in --update) UPDATE=1;; --copy) COPY=1;; *) echo "unknown option $a"; exit 2;; esac; done
VERSION="$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$HERE/.claude-plugin/plugin.json" | head -1)"

say() { printf '%s\n' "$*"; }
version_of() { [ -f "$1/SKILL.md" ] || { echo "-"; return; }; local d; d="$(cd "$1" && pwd -P)"; if [ -f "$d/../../.claude-plugin/plugin.json" ]; then sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$d/../../.claude-plugin/plugin.json" | head -1; elif [ -f "$d/VERSION" ]; then cat "$d/VERSION"; else echo "unknown"; fi; }
describe() { local p="$1"; if [ -L "$p" ]; then say "  $p -> $(readlink "$p") (v$(version_of "$p"))"; elif [ -d "$p" ]; then say "  $p (copy, v$(version_of "$p"))"; else say "  $p (absent)"; fi; }

status() { say "Stacksmith v$VERSION in this checkout: $SRC"; describe "$AGENTS_DIR/stacksmith"; describe "$CLAUDE_DIR/stacksmith"; }

# place <target> <source-path-or-empty-for-copy>
place() {
  local target="$1" link_to="$2"
  mkdir -p "$(dirname "$target")"
  if [ -e "$target" ] || [ -L "$target" ]; then
    if [ "$UPDATE" = 0 ]; then
      say "exists: $target (v$(version_of "$target")). Re-run with --update to refresh, or 'uninstall' first."; return 0
    fi
    if [ ! -L "$target" ] && [ -d "$target" ] && [ -f "$target/SKILL.md" ] && [ -n "$(cd "$target" && find . -newer SKILL.md -type f 2>/dev/null | grep -v '^./research-cache' | head -1)" ]; then
      say "refusing to overwrite $target: files newer than SKILL.md found (local edits?). Move it aside and re-run."; return 1
    fi
    rm -rf "$target"; say "removed old: $target"
  fi
  if [ -n "$link_to" ]; then ln -s "$link_to" "$target"; say "linked: $target -> $link_to"
  else cp -R "$SRC" "$target"; printf '%s\n' "$VERSION" > "$target/VERSION"; say "copied: $target (v$VERSION)"; fi
}

rel() { # relative path from dir $1 to path $2 when both are under $HOME, else absolute
  python3 - "$1" "$2" <<'PY' 2>/dev/null || printf '%s' "$2"
import os,sys; print(os.path.relpath(sys.argv[2], sys.argv[1]))
PY
}

install_one() { # host dir
  local dir="$1"
  if [ "$COPY" = 1 ]; then place "$dir/stacksmith" ""; else place "$dir/stacksmith" "$SRC"; fi
}

case "$MODE" in
  status) status ;;
  claude) install_one "$CLAUDE_DIR"; status ;;
  codex)  install_one "$AGENTS_DIR"; status ;;
  both)
    install_one "$AGENTS_DIR"
    place "$CLAUDE_DIR/stacksmith" "$(rel "$CLAUDE_DIR" "$AGENTS_DIR/stacksmith")"
    status ;;
  uninstall)
    for p in "$CLAUDE_DIR/stacksmith" "$AGENTS_DIR/stacksmith"; do
      if [ -L "$p" ] || [ -d "$p" ]; then rm -rf "$p"; say "removed: $p"; fi
    done ;;
  *) sed -n '2,9p' "$0"; exit 2 ;;
esac
say "verify: node \"$SRC/scripts/route.mjs\" --help | head -3"
