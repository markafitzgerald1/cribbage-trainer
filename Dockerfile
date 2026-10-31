FROM mcr.microsoft.com/playwright:v1.64.0-noble AS dependencies

WORKDIR /usr/src/app

# Install actionlint so npm run lint (and its sub-tasks) work in CI
RUN curl -sSL https://github.com/rhysd/actionlint/releases/download/v1.7.7/actionlint_1.7.7_linux_amd64.tar.gz | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/actionlint

COPY package*.json ./
RUN npm clean-install

# Only what Jest, Vite and Storybook read goes in before the test layers, so
# a documentation, workflow or lint-config edit leaves them cached. Lint gets
# everything else from the whole-context copy further down.
COPY __mocks__/ ./__mocks__/
COPY babel.config.json jest.config.json styles.d.ts tsconfig.json vite.config.mjs ./
COPY src/ ./src/
COPY scripts/expectedTableIdentity.mjs scripts/uncertaintySidecar.mjs scripts/tableIdentityBabel.mjs scripts/tableIdentityCacheKey.mjs scripts/tableIdentityJest.mjs scripts/tableIdentityJest.test.mjs ./scripts/

# Jest, Storybook coverage and lint read nothing the others write, so each is
# its own stage and BuildKit runs them at once. The final stage copies a
# marker out of each, which is what makes a plain `docker build` wait for,
# and fail on, all three.
FROM dependencies AS unit-tests
RUN npm test && touch /unit-tests-passed

FROM dependencies AS app-build
COPY .storybook/ ./.storybook/
# Running `build` prior to `lint` as some TypeScript ESLint issues are only
# found by ESLint when a `dist/` directory containing build output exists for
# some unknown reason.
RUN npm run build
RUN npm run storybook:build

FROM app-build AS storybook-tests
RUN npm run storybook:test:coverage && touch /storybook-tests-passed

# Every linter here globs, so any file the image never received matches
# nothing and its task still reports success: the allowlist above silently
# excused tests-e2e/ and playwright.config.ts from all ten of them. Copy the
# whole context instead of extending that allowlist, so the linted file set
# equals the working tree's by construction. Only this stage sees the copy,
# so it invalidates nothing but lint itself.
FROM app-build AS lint
COPY . .
RUN npm run lint

FROM lint
COPY --from=unit-tests /unit-tests-passed /
COPY --from=storybook-tests /storybook-tests-passed /

CMD [ "sh", "-c", "npm run test-e2e" ]
