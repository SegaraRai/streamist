#!/bin/bash

mkdir -p /tmp/transcoder-lambda-layer/bin
cp ffmpeg /tmp/transcoder-lambda-layer/bin/
cp magick /tmp/transcoder-lambda-layer/bin/
cp mkclean /tmp/transcoder-lambda-layer/bin/
chmod +x /tmp/transcoder-lambda-layer/bin/*
ln -s /tmp/transcoder-lambda-layer/bin/ffmpeg /tmp/transcoder-lambda-layer/bin/ffprobe
pushd /tmp/transcoder-lambda-layer
zip -ry9 /tmp/transcoder-lambda-layer.zip *
popd
mv /tmp/transcoder-lambda-layer.zip layer.zip
rm -rf /tmp/transcoder-lambda-layer
