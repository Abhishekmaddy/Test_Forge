# ============================================================
# Enterprise Automation Framework - Docker Image
# Multi-stage build for optimized container
# ============================================================

# Stage 1: Base with Node.js and Playwright dependencies
FROM mcr.microsoft.com/playwright:v1.43.0-jammy AS base

# Set working directory
WORKDIR /app

# Set timezone
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install additional tools
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    default-jre \
    curl \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install Allure CLI
RUN wget -q https://github.com/allure-framework/allure2/releases/download/2.27.0/allure-2.27.0.tgz \
    && tar -zxvf allure-2.27.0.tgz \
    && mv allure-2.27.0 /usr/local/allure \
    && ln -s /usr/local/allure/bin/allure /usr/local/bin/allure \
    && rm allure-2.27.0.tgz

# ============================================================
# Stage 2: Dependencies
# ============================================================
FROM base AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci --prefer-offline

# Install Playwright browsers
RUN npx playwright install --with-deps chromium firefox webkit

# ============================================================
# Stage 3: Build
# ============================================================
FROM deps AS build

WORKDIR /app

# Copy source code
COPY . .

# Build TypeScript
RUN npm run typecheck

# ============================================================
# Stage 4: Runtime
# ============================================================
FROM base AS runtime

WORKDIR /app

# Copy node_modules and built files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /root/.cache/ms-playwright /root/.cache/ms-playwright
COPY --from=build /app .

# Create necessary directories
RUN mkdir -p \
    reports/allure-results \
    reports/allure-report \
    reports/screenshots \
    reports/videos \
    reports/traces \
    reports/logs

# Environment variables with defaults
ENV ENV=staging \
    BROWSER=chromium \
    HEADED=false \
    PARALLEL=4 \
    RETRY=1 \
    LOG_LEVEL=info \
    TAGS=@regression

# Create non-root user for security
RUN groupadd -r automation && useradd -r -g automation automation
RUN chown -R automation:automation /app
USER automation

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('OK')" || exit 1

# Default command
CMD ["npm", "test"]
