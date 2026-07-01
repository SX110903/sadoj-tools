#!/bin/sh
# Production entrypoint: apply pending migrations, then start the API.
set -e

echo "==> Aplicando migraciones de base de datos (prisma migrate deploy)"
if [ -x node_modules/.bin/prisma ]; then
  node_modules/.bin/prisma migrate deploy
else
  pnpm exec prisma migrate deploy
fi

echo "==> Iniciando la API"
exec node dist/server.js
