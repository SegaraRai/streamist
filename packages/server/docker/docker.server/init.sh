#!/bin/sh

until nc -z postgres 5432; do
  >&2 echo "waiting for postgres to be ready..."
  sleep 3
done

sleep 5

npx prisma migrate deploy

exec "$@"
