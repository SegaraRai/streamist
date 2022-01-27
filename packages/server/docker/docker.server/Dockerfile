### Build Stage

FROM node:16-alpine AS build

WORKDIR /app

COPY app .
RUN npm install
RUN npx prisma generate

COPY *.sh ./
RUN chmod 0755 *.sh

### Release Stage

FROM node:16-alpine as release

WORKDIR /app

COPY --from=build /app /app

ENTRYPOINT ["/app/init.sh"]

CMD ["node", "/app/dist/index.js", "--type", "api"]
