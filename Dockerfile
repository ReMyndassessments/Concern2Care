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
  --external:fsevents \
  --alias:@shared=./shared \
  --alias:@=./client/src
RUN ls -la dist/
EXPOSE 5000
CMD ["node", "dist/index.js"]
