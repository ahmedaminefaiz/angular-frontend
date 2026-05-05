# STEP 1 — Build Angular
FROM node:20 AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# STEP 2 — Serve with Nginx
FROM nginx:alpine

COPY --from=build /app/dist/DemoFrontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
