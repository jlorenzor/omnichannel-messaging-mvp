FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/whatsapp-service/package*.json ./apps/whatsapp-service/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY apps/whatsapp-service/dist ./apps/whatsapp-service/dist
COPY libs ./libs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Start the application
CMD ["node", "apps/whatsapp-service/dist/main.js"]
