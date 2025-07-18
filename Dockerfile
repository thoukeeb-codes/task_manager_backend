# Stage 1: Build Node.js app
FROM node:22.17.0-alpine AS node-builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY server.js ./
COPY routes/ ./routes/
COPY prisma/ ./prisma/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

# Stage 2: Create final image with Nginx and Node.js
FROM nginx:alpine

# Install Node.js in the Nginx container
RUN apk add --no-cache nodejs npm

# Copy Nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy Node.js app from builder stage
COPY --from=node-builder /app /app

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'node /app/server.js &' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

# Expose port 80 for Nginx
EXPOSE 80

# Start both services
CMD ["/start.sh"]