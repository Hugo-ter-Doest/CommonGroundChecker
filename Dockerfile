FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Pinned analysis tools for the complexity, maintainability and coupling checks; installing at runtime is disabled.
ENV HYDRA_GATE_TOOLS_DIR=/opt/analysis-tools
ENV HYDRA_GATE_SIG_NO_INSTALL=1
ARG PDEPEND_SHA256=6b562a6ad2706c018c1673f389e77d683a55744c6b9654a737bacc9d2ddca6df

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates curl python3 python3-pip php-cli php-xml \
  && rm -rf /var/lib/apt/lists/* \
  && pip3 install --no-cache-dir --break-system-packages lizard==1.24.3 grimp==3.18 import-linter==2.15 \
  && npm install --silent --no-audit --no-fund --ignore-scripts --prefix /opt/analysis-tools/jscpd-4.0.5 jscpd@4.0.5 \
  && npm install --silent --no-audit --no-fund --ignore-scripts --prefix /opt/analysis-tools/dependency-cruiser-17.4.3 \
    dependency-cruiser@17.4.3 typescript@5.9.3 @vue/compiler-sfc@3.5.44 \
  && mkdir -p /opt/analysis-tools/pdepend-3.0.0 \
  && curl -fsSL -o /opt/analysis-tools/pdepend-3.0.0/pdepend.phar https://github.com/pdepend/pdepend/releases/download/3.0.0/pdepend.phar \
  && echo "${PDEPEND_SHA256}  /opt/analysis-tools/pdepend-3.0.0/pdepend.phar" | sha256sum -c -

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/scripts/maintainability ./scripts/maintainability
COPY --from=builder /app/scripts/coupling ./scripts/coupling

EXPOSE 3000
CMD ["npm", "run", "start"]
