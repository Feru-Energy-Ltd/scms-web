# syntax=docker/dockerfile:1
# Multi-stage build for Next.js standalone output.
# NEXT_PUBLIC_* are inlined at build time (npm run build), so they are passed as build args.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public config (baked into the client bundle)
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_CSMS_PATH_PREFIX
ARG NEXT_PUBLIC_PAYMENT_PATH_PREFIX
ARG NEXT_PUBLIC_AUTH_PATH_PREFIX
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_CSMS_PATH_PREFIX=$NEXT_PUBLIC_CSMS_PATH_PREFIX \
    NEXT_PUBLIC_PAYMENT_PATH_PREFIX=$NEXT_PUBLIC_PAYMENT_PATH_PREFIX \
    NEXT_PUBLIC_AUTH_PATH_PREFIX=$NEXT_PUBLIC_AUTH_PATH_PREFIX \
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
