FROM node:20-alpine
RUN apk add --no-cache openssl openssl-dev libc6-compat
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/src ./src
RUN mkdir -p public/uploads
EXPOSE 4001
ENV NODE_ENV=production
CMD npx prisma db push --skip-generate && node src/index.js