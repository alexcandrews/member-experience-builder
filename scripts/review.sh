#!/usr/bin/env bash
# review.sh — capture a live browser review of the member-experience-builder
# Uses gsd-browser (CDP automation) + showboat (executable demo docs)

set -euo pipefail

# Ensure tools installed via pipx/gsd-browser are on PATH
export PATH="$PATH:/usr/local/bin:/Users/alexandrews/.local/bin:/Users/alexandrews/.gsd-browser/bin"

# Auto-detect Vite port (tries 5173–5176, falls back to PORT env or 5173)
detect_port() {
  for p in 5173 5174 5175 5176; do
    if curl -sf "http://localhost:${p}" > /dev/null 2>&1; then
      echo "$p"; return
    fi
  done
  echo "${PORT:-5173}"
}

PORT="${PORT:-}"
BASE_URL=""
REVIEWS_DIR="$(dirname "$0")/../reviews"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DOC="${REVIEWS_DIR}/review-${TIMESTAMP}.md"
SCREENSHOTS_DIR="${REVIEWS_DIR}/screenshots-${TIMESTAMP}"

mkdir -p "$REVIEWS_DIR" "$SCREENSHOTS_DIR"

# ── helpers ──────────────────────────────────────────────────────────────────

wait_for_server() {
  echo "Waiting for dev server on ${BASE_URL}..."
  local attempts=0
  until curl -sf "${BASE_URL}" > /dev/null 2>&1; do
    if (( attempts++ >= 30 )); then
      echo "ERROR: Dev server did not start within 30 seconds." >&2
      exit 1
    fi
    sleep 1
  done
  echo "Dev server is up."
}

require_tool() {
  if ! command -v "$1" &>/dev/null; then
    echo "ERROR: '$1' not found. Install it first:" >&2
    echo "  gsd-browser: curl -fsSL https://raw.githubusercontent.com/gsd-build/gsd-browser/main/install.sh | bash" >&2
    echo "  showboat:    uv tool install showboat" >&2
    exit 1
  fi
}

capture() {
  local label="$1" file="${SCREENSHOTS_DIR}/${2}.png"
  showboat note "$DOC" "### ${label}"
  showboat exec "$DOC" bash "gsd-browser screenshot --output '${file}'"
  showboat image "$DOC" "$file"
}

# ── preflight ────────────────────────────────────────────────────────────────

require_tool gsd-browser
require_tool showboat

# Start dev server in background if not already running on any expected port
if [[ -z "$(detect_port 2>/dev/null)" ]] || ! curl -sf "http://localhost:$(detect_port)" > /dev/null 2>&1; then
  echo "Starting dev server..."
  npm --prefix "$(dirname "$0")/.." run dev &
  DEV_PID=$!
  trap 'kill $DEV_PID 2>/dev/null || true' EXIT
  sleep 4
fi

PORT="$(detect_port)"
BASE_URL="http://localhost:${PORT}"
wait_for_server

# ── showboat document ─────────────────────────────────────────────────────────

showboat init "$DOC" "Member Experience Builder — Review ${TIMESTAMP}"
showboat note "$DOC" "Auto-generated review. Re-run all code blocks with: \`showboat verify ${DOC}\`"

# Navigate
showboat note "$DOC" "## Navigation"
showboat exec "$DOC" bash "gsd-browser navigate '${BASE_URL}'"
showboat exec "$DOC" bash "gsd-browser wait-for --condition network_idle"

# Full-page screenshot
capture "Initial page load" "01-initial"

# Snapshot DOM refs for stable interaction
showboat note "$DOC" "## DOM Snapshot"
showboat exec "$DOC" bash "gsd-browser snapshot"

# Plan header close-up
capture "Plan header with milestone pills" "02-plan-header"

# Click first milestone pill using CSS selector
showboat note "$DOC" "## Milestone Detail (click first pill)"
showboat exec "$DOC" bash "gsd-browser click '.milestone-pill'"
showboat exec "$DOC" bash "gsd-browser wait-for --condition network_idle"
capture "Milestone detail panel" "03-milestone-detail"

# ── done ─────────────────────────────────────────────────────────────────────

echo ""
echo "Review saved: ${DOC}"
echo "Verify later: showboat verify '${DOC}'"
