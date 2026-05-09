# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src

# ---- Runtime stage ----
FROM node:20-alpine
WORKDIR /app

# Non-root user for security
RUN addgroup -S app && adduser -S app -G app

COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/package.json ./package.json
COPY --from=build --chown=app:app /app/src ./src

# Create writable dirs
RUN mkdir -p /app/data /app/uploads && chown -R app:app /app/data /app/uploads

USER app

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "src/index.js"]
