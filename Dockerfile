# ── Stage 1: Build React frontend ────────────────────────────────────────────
FROM node:22-alpine AS frontend-build
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Compile TypeScript backend ──────────────────────────────────────
FROM node:22-alpine AS backend-build
WORKDIR /build/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# ── Stage 3: Production image ────────────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app

# Install production runtime deps only (no TypeScript / ts-node-dev)
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy compiled backend and built frontend
COPY --from=backend-build /build/backend/dist ./backend/dist
COPY --from=frontend-build /build/frontend/dist ./frontend/dist

# Render mounts the persistent disk at /data; create it as a fallback
RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=10000
ENV DB_PATH=/data/ats.db

EXPOSE 10000

CMD ["node", "backend/dist/index.js"]
