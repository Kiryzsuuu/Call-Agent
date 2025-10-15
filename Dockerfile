FROM python:3.11-slim

# Install Node.js 18 and system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy and install Python dependencies
COPY agent/requirements.txt ./agent/
RUN pip install --no-cache-dir -r agent/requirements.txt

# Copy all source code
COPY agent/ ./agent/
COPY web/ ./web/

EXPOSE 3000 8002

# Start script that builds and runs
COPY start.sh ./
RUN chmod +x start.sh
CMD ["./start.sh"]