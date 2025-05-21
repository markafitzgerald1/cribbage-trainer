FROM mcr.microsoft.com/playwright:v1.52.0-noble

RUN apt update && \
    apt install --yes make gcc g++

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm clean-install

COPY . .

# Running `build` prior to `lint` as some TypeScript ESLint issues are only
# found by ESLint when a `dist/` directory containing build output exists for
# some unknown reason.
RUN npm run build && npm run lint && npm test && npm run storybook:build

CMD [ "sh", "-c", "npm run storybook:test && npm run test-e2e" ]
