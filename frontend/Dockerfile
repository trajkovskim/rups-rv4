FROM node:22-slim AS build

WORKDIR /app

# Najprej samo odvisnosti, da se ta korak ob spremembi kode ne ponavlja
COPY package.json package-lock.json ./
COPY components/package.json components/
COPY ui/package.json ui/
RUN npm ci

COPY . .

# NEXT_PUBLIC_ vrednosti se ob gradnji zapečejo v kodo za brskalnik
ARG NEXT_PUBLIC_API_URL=http://localhost:8080/api
ARG NEXT_PUBLIC_USE_MOCK_QUESTIONS=false
ARG NEXT_PUBLIC_USE_MOCK_GEO=true
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_USE_MOCK_QUESTIONS=$NEXT_PUBLIC_USE_MOCK_QUESTIONS \
    NEXT_PUBLIC_USE_MOCK_GEO=$NEXT_PUBLIC_USE_MOCK_GEO \
    NEXT_OUTPUT=standalone

# Zgradi najprej knjižnico komponent, nato aplikacijo
RUN npm run build

FROM node:22-slim

WORKDIR /app

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY --from=build --chown=node:node /app/ui/.next/standalone ./
COPY --from=build --chown=node:node /app/ui/.next/static ./ui/.next/static
COPY --from=build --chown=node:node /app/ui/public ./ui/public

USER node
EXPOSE 3000

CMD ["node", "ui/server.js"]
