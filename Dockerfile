FROM node:24-slim AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts
    
FROM deps AS build
COPY . .
RUN pnpm run build
RUN pnpm prune --prod

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node package.json LICENSE ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
CMD ["node", "dist/index.js"]
