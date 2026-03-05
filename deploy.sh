#!/bin/bash
set -e

echo "=== Unpack Deploy ==="

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Pull secrets from SSM Parameter Store into .env
echo "Fetching secrets from SSM..."
fetch_ssm() {
  local val
  val=$(aws ssm get-parameter --name "$1" --with-decryption --query 'Parameter.Value' --output text)
  if [ -z "$val" ]; then
    echo "ERROR: Failed to fetch $1 from SSM" >&2
    exit 1
  fi
  printf '%s=%s\n' "$2" "$val"
}

: > .env
chmod 600 .env
fetch_ssm /unpack/ANTHROPIC_API_KEY ANTHROPIC_API_KEY >> .env
fetch_ssm /unpack/DATABASE_URL DATABASE_URL >> .env
fetch_ssm /unpack/VITE_SUPABASE_URL VITE_SUPABASE_URL >> .env
fetch_ssm /unpack/VITE_SUPABASE_ANON_KEY VITE_SUPABASE_ANON_KEY >> .env

# Install dependencies
echo "Installing dependencies..."
~/.bun/bin/bun install

# Build client
echo "Building client..."
~/.bun/bin/bun run build

# Restart app via PM2
echo "Restarting app..."
if pm2 describe unpack > /dev/null 2>&1; then
  pm2 restart ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save

echo "=== Deploy complete ==="
