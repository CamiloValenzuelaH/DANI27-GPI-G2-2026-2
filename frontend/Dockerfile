<<<<<<< HEAD
FROM node:18-slim

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173
=======
FROM node:18-slim

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173
>>>>>>> Chat-bot
CMD ["npm", "run", "dev", "--", "--host"]