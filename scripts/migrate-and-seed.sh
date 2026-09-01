#!/bin/sh
set -e

echo "› waiting for the database…"
tries=0
until node -e "
  const { Client } = require('pg');
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  c.connect().then(() => c.end()).then(() => process.exit(0)).catch(() => process.exit(1));
" 2>/dev/null; do
  tries=$((tries + 1))
  if [ "$tries" -ge 30 ]; then
    echo "✗ database never became reachable" >&2
    exit 1
  fi
  sleep 2
done

echo "› running migrations"
npx sequelize-cli db:migrate

echo "› running seeders"
npx sequelize-cli db:seed:all

echo "✓ database ready"
