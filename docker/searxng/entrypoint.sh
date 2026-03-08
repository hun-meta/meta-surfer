#!/bin/sh
# Custom entrypoint: inject proxy settings into SearXNG settings.yml
# SEARXNG_PROXY_URL is required for stable search performance.

SETTINGS_FILE="/etc/searxng/settings.yml"

if [ -n "$SEARXNG_PROXY_URL" ]; then
  echo "[entrypoint] Injecting proxy: $SEARXNG_PROXY_URL"
  cat >> "$SETTINGS_FILE" <<EOF
  proxies:
    all://:
      - $SEARXNG_PROXY_URL
EOF
  echo "[entrypoint] Proxy configuration added to settings.yml"
else
  echo "[entrypoint] WARNING: SEARXNG_PROXY_URL is not set."
  echo "[entrypoint] Search performance will be severely degraded without a proxy."
  echo "[entrypoint] Set SEARXNG_PROXY_URL in .env.local (see .env.example)."
fi

# Run the original SearXNG entrypoint
exec /usr/local/searxng/entrypoint.sh "$@"
