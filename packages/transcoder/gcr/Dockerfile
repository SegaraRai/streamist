### Build Stage

FROM alpine:3 AS build

WORKDIR /app

COPY app .
RUN find . -type d -exec chmod 0755 {} +
RUN find . -type f -exec chmod 0644 {} +
RUN chmod 0755 ./bin/*
RUN ln -s ./ffmpeg ./bin/ffprobe

### Release Stage

FROM node:16-alpine as release

WORKDIR /app

COPY --from=build /app /app

ENV MAGICK_CONFIGURE_PATH /app/imconfig
ENV PATH /app/bin:$PATH

CMD ["node", "/app/index.js"]

# docker build -t streamist-transcoder-gcr .
# docker run --name streamist-transcoder-gcr -e "PORT=8080" -e "API_ORIGIN_FOR_TRANSCODER=https://dummy" -e "SECRET_TRANSCODER_CALLBACK_SECRET=dummy" -e "SECRET_TRANSCODER_WASABI_ACCESS_KEY_ID=dummy" -e "SECRET_TRANSCODER_WASABI_SECRET_ACCESS_KEY=dummy" -p 21090:8080 --rm streamist-transcoder-gcr
