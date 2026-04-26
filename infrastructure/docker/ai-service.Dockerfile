# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat \
    && corepack enable \
    && corepack prepare pnpm@9.15.4 --activate

WORKDIR /workspace

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN corepack pnpm install --no-frozen-lockfile

FROM deps AS builder
RUN corepack pnpm --filter ai-service build

FROM base AS runner
WORKDIR /workspace

ENV NODE_ENV=production
ENV PORT=3002

COPY --from=builder /workspace /workspace

WORKDIR /workspace/apps/ai-service

EXPOSE 3002

CMD ["node", "dist/main.js"]
