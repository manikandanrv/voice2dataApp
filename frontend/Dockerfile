# --- Stage 1: Build ---
# Using your specific Node version for consistency
FROM node:20.11.1-alpine AS build-stage

WORKDIR /app

# Install dependencies first (better Docker caching)
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:stable-alpine

# Copy the build output from Stage 1 to Nginx
# Note: Vite uses 'dist', Create React App uses 'build'
COPY --from=build-stage /app/dist /usr/share/nginx/html


# FROM nginx:stable-alpine
# COPY --from=build-stage /app/dist /usr/share/nginx/html
# # Add this line:
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]
# Copy custom Nginx config to handle React routing and API proxying
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]