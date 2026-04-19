FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npx esbuild server/index.ts \
  --platform=node \
  --bundle \
  --format=esm \
  --outdir=dist \
  --external:vite \
  --external:../vite.config \
  --external:./vite.config \
  --alias:@shared=./shared
RUN ls -la dist/
EXPOSE 5000
CMD ["node", "dist/index.js"]
