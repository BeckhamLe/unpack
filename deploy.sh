#!/bin/bash
set -e

echo "=== Unpack Deploy ==="

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Pull secrets from SSM Parameter Store into .env
echo "Fetching secrets from SSM..."
cat > .env << EOF
ANTHROPIC_API_KEY=$(aws ssm get-parameter --name /unpack/ANTHROPIC_API_KEY --with-decryption --query 'Parameter.Value' --output text)
DATABASE_URL=$(aws ssm get-parameter --name /unpack/DATABASE_URL --with-decryption --query 'Parameter.Value' --output text)
VITE_SUPABASE_URL=$(aws ssm get-parameter --name /unpack/VITE_SUPABASE_URL --with-decryption --query 'Parameter.Value' --output text)
VITE_SUPABASE_ANON_KEY=$(aws ssm get-parameter --name /unpack/VITE_SUPABASE_ANON_KEY --with-decryption --query 'Parameter.Value' --output text)
EOF

# Install dependencies
echo "Installing dependencies..."
~/.bun/bin/bun install

# Build client
echo "Building client..."
~/.bun/bin/bun run build

# Restart app via PM2
echo "Restarting app..."
pm2 restart ecosystem.config.cjs --update-env 2>/dev/null || pm2 start ecosystem.config.cjs
pm2 save

echo "=== Deploy complete ==="
