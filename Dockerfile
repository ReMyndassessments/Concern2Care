FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
RUN addgroup -g 1001 -S nodejs
RUN adduser -S concern2care -u 1001
USER concern2care
EXPOSE 5000
CMD ["node", "dist/index.js"]