FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-kernel/package.json ./packages/shared-kernel/
COPY packages/will-domain/package.json ./packages/will-domain/
RUN npm ci 2>/dev/null || npm install

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @will-maker/shared-kernel && \
    npm run build -w @will-maker/will-domain && \
    npm run prisma:generate -w @will-maker/api && \
    npm run build -w @will-maker/api

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/src/infrastructure/persistence/prisma ./apps/api/src/infrastructure/persistence/prisma
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy --schema=src/infrastructure/persistence/prisma/schema.prisma && node dist/main.js"]
