FROM node:20-alpine AS build

WORKDIR /app
COPY . .

# Install and build the frontend
RUN npm ci && npm run build

# Use nginx to serve built files
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
