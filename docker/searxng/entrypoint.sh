#!/bin/sh
# Custom entrypoint: inject proxy settings into SearXNG settings.yml if SEARXNG_PROXY_URL is set

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
  echo "[entrypoint] No SEARXNG_PROXY_URL set, running without proxy"
fi

# Run the original SearXNG entrypoint
exec /usr/local/searxng/entrypoint.sh "$@"
