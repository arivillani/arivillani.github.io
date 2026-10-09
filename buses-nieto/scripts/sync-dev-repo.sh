#!/usr/bin/env bash
# Publica buses-nieto/ en el repo dev (arivillani/buses-nieto-dev) conservando la historia.
# El repo dev es un espejo: su main siempre avanza en fast-forward desde el repo fuente.
set -euo pipefail

remote="${1:-https://github.com/arivillani/buses-nieto-dev.git}"
cd "$(git rev-parse --show-toplevel)"

if [ -n "$(git status --porcelain -- buses-nieto)" ]; then
  echo "Hay cambios sin commitear en buses-nieto/; commitealos antes de sincronizar." >&2
  exit 1
fi

git subtree split --prefix=buses-nieto -b buses-nieto-dev-sync
git push "$remote" buses-nieto-dev-sync:main
