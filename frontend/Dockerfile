# Base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies with frozen lockfile
RUN yarn install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app

# API config passed from podman-compose (no defaults here!)
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_API_URL

# Inject into build env
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN yarn build

# Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Accept build args again for runtime (Next.js standalone still uses them)
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy built output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root
USER nextjs

# Expose Next.js port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Start production server
CMD ["node", "server.js"]
