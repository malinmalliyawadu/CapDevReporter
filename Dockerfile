# syntax=docker.io/docker/dockerfile:1

FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
ARG ***REMOVED***ROOTCACERT 
RUN if [ -n "$***REMOVED***ROOTCACERT" ]; then \
    echo "$***REMOVED***ROOTCACERT" > /root/wlgca.crt; \
    cat /root/wlgca.crt >> /etc/ssl/certs/ca-certificates.crt; \
    apk --no-cache add ca-certificates \
    && rm -rf /var/cache/apk/*; \
    cp /root/wlgca.crt /usr/local/share/ca-certificates/wlgca.crt; \
    update-ca-certificates; \
    fi

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
ARG ***REMOVED***ROOTCACERT 
# Add build-time environment variables
ARG DATABASE_URL
ARG NEXT_PUBLIC_JIRA_HOST
ARG JIRA_API_TOKEN
ARG JIRA_USER_EMAIL
ARG IPAYROLL_API_URL
ARG IPAYROLL_API_KEY
ARG IPAYROLL_COMPANY_ID

# Set environment variables for build
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXT_PUBLIC_JIRA_HOST=${NEXT_PUBLIC_JIRA_HOST}
ENV JIRA_API_TOKEN=${JIRA_API_TOKEN}
ENV JIRA_USER_EMAIL=${JIRA_USER_EMAIL}
ENV IPAYROLL_API_URL=${IPAYROLL_API_URL}
ENV IPAYROLL_API_KEY=${IPAYROLL_API_KEY}
ENV IPAYROLL_COMPANY_ID=${IPAYROLL_COMPANY_ID}

RUN if [ -n "$***REMOVED***ROOTCACERT" ]; then \
    echo "$***REMOVED***ROOTCACERT" > /root/wlgca.crt; \
    cat /root/wlgca.crt >> /etc/ssl/certs/ca-certificates.crt; \
    apk --no-cache add ca-certificates \
    && rm -rf /var/cache/apk/*; \
    cp /root/wlgca.crt /usr/local/share/ca-certificates/wlgca.crt; \
    update-ca-certificates; \
    fi
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
ARG ***REMOVED***ROOTCACERT
# Add runtime environment variables
ENV DATABASE_URL="file:/app/data/timesheet.db"
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production
ARG NEXT_PUBLIC_JIRA_HOST
ARG JIRA_API_TOKEN
ARG JIRA_USER_EMAIL
ARG IPAYROLL_API_URL
ARG IPAYROLL_API_KEY
ARG IPAYROLL_COMPANY_ID
ENV NEXT_PUBLIC_JIRA_HOST=${NEXT_PUBLIC_JIRA_HOST}
ENV JIRA_API_TOKEN=${JIRA_API_TOKEN}
ENV JIRA_USER_EMAIL=${JIRA_USER_EMAIL}
ENV IPAYROLL_API_URL=${IPAYROLL_API_URL}
ENV IPAYROLL_API_KEY=${IPAYROLL_API_KEY}
ENV IPAYROLL_COMPANY_ID=${IPAYROLL_COMPANY_ID}

RUN if [ -n "$***REMOVED***ROOTCACERT" ]; then \
    echo "$***REMOVED***ROOTCACERT" > /root/wlgca.crt; \
    cat /root/wlgca.crt >> /etc/ssl/certs/ca-certificates.crt; \
    apk --no-cache add ca-certificates \
    && rm -rf /var/cache/apk/*; \
    cp /root/wlgca.crt /usr/local/share/ca-certificates/wlgca.crt; \
    update-ca-certificates; \
    fi
WORKDIR /app

# Create prisma directory and set permissions
RUN mkdir -p prisma && chown -R 1001:1001 prisma

# Copy Prisma files and generate client
COPY --from=builder /app/prisma/schema.prisma ./prisma/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy SQLite database
COPY prisma/dev.db ./prisma/dev.db
RUN chown -R 1001:1001 ./prisma/dev.db

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure Prisma files have correct permissions
RUN chown -R nextjs:nodejs ./prisma
RUN chown -R nextjs:nodejs ./node_modules/.prisma
RUN chown -R nextjs:nodejs ./node_modules/@prisma

USER nextjs

EXPOSE 3000

# Copy database initialization script
COPY --chown=nextjs:nodejs prisma/schema.prisma ./prisma/
COPY --chown=nextjs:nodejs scripts/init-db.sh ./scripts/

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
CMD ["/bin/sh", "-c", "./scripts/init-db.sh && node server.js"]