FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /usr/src/app

# Install actionlint so npm run lint (and its sub-tasks) work in CI
RUN curl -sSL https://github.com/rhysd/actionlint/releases/download/v1.7.7/actionlint_1.7.7_linux_amd64.tar.gz | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/actionlint

COPY package*.json ./
RUN npm clean-install

COPY . .

RUN npm test

# Running `build` prior to `lint` as some TypeScript ESLint issues are only
# found by ESLint when a `dist/` directory containing build output exists for
# some unknown reason.
RUN npm run build

RUN npm run lint

RUN npm run storybook:build

CMD [ "sh", "-c", "npm run storybook:test && npm run test-e2e" ]
