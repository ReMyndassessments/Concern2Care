FROM node:20-alpine
WORKDIR /app
COPY . .
RUN cd server && npm install
RUN cd server && npm run build
EXPOSE 5000
CMD ["node", "server/dist/index.js"]
