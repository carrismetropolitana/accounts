FROM node:22.5.1

WORKDIR /app

COPY package.json ./

RUN npm install \
    && npm cache clean --force

RUN npx @helperkits/bumper bump

COPY . .

RUN ["npm", "run", "build"]

CMD ["node", "dist/src/index.js"]