# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY public ./public
COPY src ./src
COPY .env.example ./.env

# CRA will read REACT_APP_* env vars at build time
ARG REACT_APP_AUTH_API
ARG REACT_APP_INTERACTION_API
ENV REACT_APP_AUTH_API=${REACT_APP_AUTH_API:-http://localhost:8001}
ENV REACT_APP_INTERACTION_API=${REACT_APP_INTERACTION_API:-http://localhost:8002}

RUN npm run build

# ---- Runtime stage: nginx serves static build ----
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
