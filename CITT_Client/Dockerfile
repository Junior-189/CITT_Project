FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM docker.io/library/nginx:alpine AS production
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app
RUN chown -R app:app /usr/share/nginx/html /var/cache/nginx /var/run

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
