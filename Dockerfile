FROM mcr.microsoft.com/playwright:v1.54.1-noble

WORKDIR /usr/src/app

# Install actionlint so npm run lint (and its sub-tasks) work in CI
RUN curl -sSL https://github.com/rhysd/actionlint/releases/download/v1.7.7/actionlint_1.7.7_linux_amd64.tar.gz | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/actionlint

COPY package*.json ./
RUN npm clean-install

COPY __mocks__/ ./__mocks__/
COPY .github/ .github/
COPY .cspell.json .gitignore .jscpd.json .markdownlint.json .markdownlintignore .nsprc .prettierignore .prettierrc.json .stylelintignore .stylelintrc.json babel.config.json eslint.config.mjs jest.config.json package.json package-lock.json styles.d.ts tsconfig.json vite.config.js ./
COPY src/ ./src/

RUN npm test

# Running `build` prior to `lint` as some TypeScript ESLint issues are only
# found by ESLint when a `dist/` directory containing build output exists for
# some unknown reason.
RUN npm run build

RUN npm run lint

COPY .storybook/ ./.storybook/

RUN npm run storybook:build
RUN npm run storybook:test

COPY playwright.config.ts ./
COPY tests-e2e/ ./tests-e2e/

CMD [ "sh", "-c", "npm run test-e2e" ]
