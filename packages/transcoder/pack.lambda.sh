#!/bin/sh

rm -rf dist
pnpm run build:lambda
cd dist && zip -r -D ../dist.zip * && cd ..
