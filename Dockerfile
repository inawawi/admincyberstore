FROM node:22-bookworm-slim

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/storefront/package.json ./apps/storefront/package.json
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build:admin

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start:admin"]
