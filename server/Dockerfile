# Use a specific version of node:20-alpine for better reproducibility
FROM node:20-alpine AS base

# Builder stage
FROM base AS builder

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Runner stage
FROM base AS runner

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/dist/src ./dist/src
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev --ignore-scripts

# Use environment variables for configuration
ENV NODE_ENV=production


# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/src/index.js"]