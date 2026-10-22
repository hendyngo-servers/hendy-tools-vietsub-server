# ==========================================
# STAGE 1: Tầng xây dựng (Builder)
# ==========================================
FROM node:20-bullseye-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/preload_models.py ./backend/
RUN python3 backend/preload_models.py

COPY package*.json ./
RUN npm ci --omit=dev


# ==========================================
# STAGE 2: Tầng chạy thực tế (Runtime Slim)
# ==========================================
FROM node:20-bullseye-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY --from=builder /root/.cache /root/.cache
COPY --from=builder /app/node_modules ./node_modules

COPY . .
RUN mkdir -p uploads

EXPOSE 3000
CMD ["node", "backend/server.js"]
