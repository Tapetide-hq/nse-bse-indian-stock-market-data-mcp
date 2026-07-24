# Dockerfile for Glama MCP server introspection / release build.
# Builds the TypeScript stdio bridge and runs it.
#
# Glama starts this container and sends an MCP introspection request
# (initialize + tools/list) over stdio. The bridge forwards to the remote
# Tapetide MCP server, so a TAPETIDE_TOKEN must be provided as an env var
# on the Glama Dockerfile admin page (get one free at
# https://tapetide.com/settings/tokens).

FROM node:20-alpine AS build
WORKDIR /app

# Install all deps (incl. devDeps like typescript) for the build.
COPY package.json package-lock.json* ./
RUN npm install

# Compile TypeScript -> dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Runtime image ─────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only the compiled output and package manifest are needed at runtime;
# the bridge has zero runtime dependencies.
COPY package.json ./
COPY --from=build /app/dist ./dist

# stdio MCP server — communicates over stdin/stdout (JSON-RPC).
ENTRYPOINT ["node", "dist/index.js"]
