#!/usr/bin/env bash

set -euo pipefail

APP_URL="http://127.0.0.1:5174/#/landing"
HEALTH_URL="http://127.0.0.1:5174/"

echo "MoOn presentation preflight"
echo

if lsof -nP -iTCP:5174 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "1. Dev server: listening on 127.0.0.1:5174"
else
  echo "1. Dev server: not running"
  echo "   Run: npm run dev:present"
  exit 1
fi

if curl -fsS "$HEALTH_URL" >/dev/null; then
  echo "2. App health: OK"
else
  echo "2. App health: failed"
  exit 1
fi

echo "3. Presentation entry:"
echo "   $APP_URL"
echo
echo "4. Before the meeting:"
echo "   - Open #/landing"
echo "   - Click Start presentation"
echo "   - Keep Presenter mode enabled"
echo "   - Keep #/demo as the backup route"
