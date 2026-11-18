FROM node:22-bookworm-slim

WORKDIR /app
ENV TZ=UTC

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "docker/entrypoint.sh"]
