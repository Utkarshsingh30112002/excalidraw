FROM node:20-alpine

WORKDIR /usr/src/app

COPY ./package.json ./package.json
COPY ./pnpm-lock.yaml ./pnpm-lock.yaml
COPY ./pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY ./packages ./packages
COPY ./turbo.json ./turbo.json

COPY ./apps/ws-backend/package.json ./apps/ws-backend/package.json
COPY ./apps/ws-backend/turbo.json ./apps/ws-backend/turbo.json

RUN corepack enable && corepack prepare pnpm@latest --activate

RUN pnpm install
COPY ./apps/ws-backend ./apps/ws-backend

RUN pnpm run db:migrate

EXPOSE 8080
CMD ["pnpm", "run", "start:ws"]