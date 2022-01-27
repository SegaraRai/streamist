#!/bin/sh

until nc -z nodejs $API_SERVER_PORT; do
  >&2 echo "waiting for nodejs to be ready..."
  sleep 3
done

sleep 5

# exec is required to handle signals
exec node /app/dist/index.js --type batch
