FROM python:3.11-slim

# Avoid buffering and bytecode files
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install system dependencies required by discord.py voice features and cryptography
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libffi-dev \
        libsodium-dev \
        ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies first for better layer caching
COPY requirements.txt .
RUN python -m pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

# Use shell form to allow environment variable expansion
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info
