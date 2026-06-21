FROM node:20-alpine

# ffmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

# init db on first run
RUN node init-db.js || true

ENV PORT=3000 \
    DB_PATH=/data/cctv.db \
    VIDEO_SIZE=960x540 \
    VIDEO_FPS=15 \
    VIDEO_BITRATE=800k \
    REC_SIZE=1280x720

VOLUME ["/data", "/app/public/records", "/app/public/streams"]

EXPOSE 3000

CMD ["node", "server.js"]
