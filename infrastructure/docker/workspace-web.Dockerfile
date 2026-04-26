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
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ARG NEXT_PUBLIC_WORKSPACE_BASE_PATH=/workspace
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WORKSPACE_BASE_PATH=$NEXT_PUBLIC_WORKSPACE_BASE_PATH
RUN corepack pnpm --filter workspace-web build

FROM base AS runner
WORKDIR /workspace

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_WORKSPACE_BASE_PATH=/workspace

COPY --from=builder /workspace /workspace

WORKDIR /workspace/apps/workspace-web

EXPOSE 3001

CMD ["corepack", "pnpm", "start"]
