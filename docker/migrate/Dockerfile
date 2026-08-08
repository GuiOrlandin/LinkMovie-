FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/

RUN pnpm install --filter @linkmovie/shared... --frozen-lockfile

COPY packages/shared/prisma packages/shared/prisma

WORKDIR /app/packages/shared

CMD ["pnpm", "exec", "prisma", "migrate", "deploy", "--schema", "prisma"]
