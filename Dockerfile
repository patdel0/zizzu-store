# ============================================
# Development Dockerfile for Next.js
# ============================================
ARG NODE_VERSION=24.14.0-slim

FROM node:${NODE_VERSION} AS dev

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/usr/local/share/.cache/yarn \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
  if [ -f package-lock.json ]; then \
    npm ci --no-audit --no-fund; \
  elif [ -f yarn.lock ]; then \
    corepack enable yarn && yarn install --frozen-lockfile --production=false; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

COPY . .

# No WATCHPACK_POLLING: Turbopack (the default dev bundler) uses its own
# native watcher, which that variable does not reach, and the bind mount in
# compose.yaml delivers inotify events natively on Linux anyway.
ENV HOSTNAME="0.0.0.0"

# `.next` is in .dockerignore, so it does not exist in the image. Create it
# before the chown: Docker seeds the anonymous volume that masks it from the
# image path, and without this the volume is created root-owned while the
# container runs as `node`, so `next dev` cannot write `.next/dev`.
RUN mkdir -p /app/.next

RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["sh", "-c", "if [ -f package-lock.json ]; then npm run dev; elif [ -f yarn.lock ]; then yarn dev; elif [ -f pnpm-lock.yaml ]; then pnpm dev; else npm run dev; fi"]
