#!/bin/bash
set -e
# `set -e` is load-bearing: without it, a failing `npx next build` (or
# `tinacms build`) still falls through to the unconditional "✅ Build
# completed successfully!" below with exit 0 — which is exactly what let a
# broken hourly post (truncated MDX) silently pass as a successful deploy.

# Build script that handles TinaCMS configuration gracefully
# If TinaCMS credentials are not provided, we skip the TinaCMS cloud build

# Check if TinaCMS credentials are set
if [ -z "$NEXT_PUBLIC_TINA_CLIENT_ID" ] || [ -z "$TINA_TOKEN" ]; then
  echo "⚠️  TinaCMS credentials not found. Skipping TinaCMS cloud build..."
  echo "ℹ️  TinaCMS will run in self-hosted mode (local filesystem editing)"
else
  echo "ℹ️  TinaCMS credentials found. Building with cloud support..."

  # Run TinaCMS build when credentials are provided
  echo "🔨 Building TinaCMS admin..."
  npx tinacms build
fi

# Run Next.js build
echo "🔨 Building Next.js app..."
npx next build

echo "✅ Build completed successfully!"
