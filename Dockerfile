FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --log-level=verbose 2>&1 || true
RUN ls dist/ || echo "dist folder empty"
EXPOSE 5000
CMD ["node", "dist/index.js"]
