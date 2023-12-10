FROM mcr.microsoft.com/playwright:v1.40.1-jammy

RUN apt update && \
    apt install --yes make gcc g++

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "npm", "run", "test-e2e" ]
