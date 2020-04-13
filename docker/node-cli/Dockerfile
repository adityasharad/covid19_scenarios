FROM node:12.16.1-alpine3.11

WORKDIR /runner

COPY package.json yarn.lock *.js ./
COPY config ./config/
COPY lib ./lib/
COPY schemas ./schemas/
COPY src ./src/
COPY tools ./tools/

RUN yarn install --frozen-lockfile
RUN yarn schema:totypes

RUN npm install -g typescript
# The Yarn build in this repo is designed to bundle and deploy the webapp.
# So instead of using a Yarn target, run the TypeScript compiler directly on the CLI source.
# This is likely to find compile errors in unrelated files, so don't fail in that case.
RUN tsc --jsx react --esModuleInterop --resolveJsonModule src/algorithms/cli.ts || cd .

ENTRYPOINT [ "node", "src/algorithms/cli.js" ]
