#!/bin/sh

cd /app
docker load -i ./streamist-server.tar.xz
docker compose pull
docker compose up -d
rm -f ./streamist-server.tar.xz
