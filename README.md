# SADOJ Fiscalía

Sistema interno de gestión para la Fiscalía del Departamento de Justicia de San Andreas.

## Prerrequisitos

- Node.js 20 LTS o superior
- pnpm 10
- Docker y Docker Compose

## Setup local

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
docker compose -f docker/docker-compose.dev.yml up -d
pnpm prisma:migrate
pnpm dev:api
```

El seed crea el usuario inicial:

- Usuario: `admin`
- Contraseña: `Admin1234!`
- Rol: `FISCAL_GENERAL`

## Estructura

- `apps/api`: backend Fastify, Prisma, Redis y JWT.
- `apps/web`: frontend React base.
- `packages/shared`: tipos, permisos y constantes compartidas.
- `docker`: Compose y configuración Nginx.

## Auth

Endpoints de Fase 1:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

El refresh token se almacena en cookie `httpOnly`, `SameSite=Strict`; Redis guarda refresh tokens activos y blacklist de access tokens revocados.
WWWWWW
