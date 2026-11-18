#!/bin/sh
set -e
node scripts/wait-for-db.mjs
exec npm run start
