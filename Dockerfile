FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
COPY test ./test
COPY registry ./registry
COPY web ./web
COPY site ./site
COPY desktop ./desktop
COPY docs/INSTALL.md ./docs/INSTALL.md
RUN npm test && npm prune --omit=dev --ignore-scripts

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production SAFEREACH_HOME=/home/node/.local/share/safereach
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist/src ./dist/src
COPY --chown=node:node package.json ./
COPY --chown=node:node registry ./registry
COPY --chown=node:node web ./web
RUN mkdir -p /home/node/.local/share/safereach && chown node:node /home/node/.local/share/safereach
USER node
CMD ["node", "dist/src/server.js"]
