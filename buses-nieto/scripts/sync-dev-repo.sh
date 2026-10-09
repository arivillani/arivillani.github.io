#!/usr/bin/env bash
# Publica buses-nieto/ en el repo dev (arivillani/buses-nieto-dev) conservando la historia.
# El repo dev es un espejo: solo recibe commits que ya están en el repo fuente, y su main
# avanza siempre en fast-forward (un push rechazado nunca se fuerza).
set -euo pipefail

remote="${1:-https://github.com/arivillani/buses-nieto-dev.git}"
cd "$(git rev-parse --show-toplevel)"

if [ -n "$(git status --porcelain -- buses-nieto)" ]; then
  echo "Hay cambios sin commitear en buses-nieto/; commitealos antes de sincronizar." >&2
  exit 1
fi

if ! git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1 \
  || ! git merge-base --is-ancestor HEAD '@{u}'; then
  echo "HEAD no está pusheado al repo fuente: pusheá la rama antes de sincronizar el espejo." >&2
  exit 1
fi

split="$(git subtree split --prefix=buses-nieto)"
git push "$remote" "${split}:refs/heads/main"
