FROM mcr.microsoft.com/playwright:v1.49.0-jammy

RUN apt update && \
    apt install --yes make gcc g++

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "npm", "run", "test-e2e" ]
