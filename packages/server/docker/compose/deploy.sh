#!/bin/sh

cd /app
docker load -i ./streamist-server.tar.xz
docker-compose up -d
