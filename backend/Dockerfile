FROM node:22-slim

WORKDIR /app

# Najprej samo odvisnosti, da se ta korak ob spremembi kode ne ponavlja
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

USER node
EXPOSE 8080

# Migracije in seed lahko tečejo večkrat, zato sta del vsakega zagona
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && exec node --import tsx src/server.ts"]
