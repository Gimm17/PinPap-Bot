# =====================
# PAP Bot - Dockerfile (v2)
# =====================

# Use Node.js 18 Alpine - Updated for Railway
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev --no-audit

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p data logs

# Set environment variables
ENV NODE_ENV=production
ENV STORAGE=memory

# Expose port for web server
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start bot
CMD ["node", "src/index.js"]