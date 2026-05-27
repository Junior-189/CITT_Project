# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Production stage
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache dumb-init tini

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY . .

RUN mkdir -p uploads logs && chown -R nodejs:nodejs uploads logs

USER nodejs

EXPOSE 5000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
