#!/bin/sh

rm -rf gcr/app
mkdir -p gcr/app
pnpm exec rollup -c rollup.config.gcr.js
mkdir -p gcr/app/bin
cp ffmpeg gcr/app/bin
cp magick gcr/app/bin
mkdir -p gcr/app/imconfig
cp policy.xml gcr/app/imconfig/
cp sRGB_ICC_v4_Appearance.icc gcr/app/
