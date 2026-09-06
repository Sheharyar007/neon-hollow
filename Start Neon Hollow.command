#!/bin/zsh
# Double-click in Finder to start this project's local preview.
cd -- "${0:A:h}" || exit 1
if command -v node >/dev/null 2>&1; then
  exec node server.mjs
fi
neon_runtime="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
if [[ -x "$neon_runtime" ]]; then
  exec "$neon_runtime" server.mjs
fi
print 'Node.js 22 or newer is needed. Install Node.js, then open this launcher again.'
read '?Press Return to close.'
