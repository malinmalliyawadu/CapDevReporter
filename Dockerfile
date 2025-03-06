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

# Install dependencies using npm
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
ARG ***REMOVED***ROOTCACERT 
# Add build-time environment variables
ARG DATABASE_URL
ARG NEXT_PUBLIC_JIRA_URL
# Set environment variables for build
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXT_PUBLIC_JIRA_URL=${NEXT_PUBLIC_JIRA_URL}

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

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
ARG ***REMOVED***ROOTCACERT

ENV NODE_ENV=production

# Setup certificates for local development proxy
RUN if [ -n "$***REMOVED***ROOTCACERT" ]; then \
    echo "$***REMOVED***ROOTCACERT" > /root/wlgca.crt; \
    cat /root/wlgca.crt >> /etc/ssl/certs/ca-certificates.crt; \
    apk --no-cache add ca-certificates \
    && rm -rf /var/cache/apk/*; \
    cp /root/wlgca.crt /usr/local/share/ca-certificates/wlgca.crt; \
    update-ca-certificates; \
    fi

# Setup non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy only what's needed to run the application
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]