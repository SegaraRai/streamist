### Build Stage

FROM alpine:3 AS build

WORKDIR /app

COPY app .
RUN find . -type d -exec chmod 0755 {} +
RUN find . -type f -exec chmod 0644 {} +
RUN chmod 0755 ./bin/*
RUN chmod 0644 ./imconfig/*
RUN chmod 0644 ./*.icc
RUN chmod 0644 ./*.js
RUN chmod 0644 ./*.mjs
RUN ln -s ./bin/ffmpeg ./bin/ffprobe

### Release Stage

FROM node:16-alpine as release

WORKDIR /app

COPY --from=build /app /app

ENV MAGICK_CONFIGURE_PATH /app/imconfig
ENV PATH /app/bin:$PATH

CMD [ "node", "/app/index.js" ]

# docker build -t gcr-transcode .
# docker run --name gcr -e "PORT=8080" -p 21090:8080 --rm gcr-transcode
