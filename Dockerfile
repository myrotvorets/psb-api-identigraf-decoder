FROM myrotvorets/node:latest@sha256:cda826319c6bde03d63791be0e4ed5caee64be0b40efa66170272f13d313fbd4 AS build
USER root
WORKDIR /srv/service
RUN chown nobody:nogroup /srv/service
USER nobody:nogroup
COPY --chown=nobody:nogroup ./package.json ./package-lock.json ./tsconfig.json .npmrc* ./
RUN \
    npm r --package-lock-only \
        eslint @myrotvorets/eslint-config-myrotvorets-ts eslint-formatter-gha eslint-plugin-mocha \
        mocha @types/mocha chai @types/chai chai-as-promised @types/chai-as-promised supertest @types/supertest mock-knex @types/mock-knex c8 mocha-multi mocha-reporter-gha mocha-reporter-sonarqube \
        nodemon ts-node && \
    npm ci --ignore-scripts --userconfig .npmrc.local && \
    rm -f .npmrc.local && \
    npm rebuild && \
    npm run prepare --if-present
COPY --chown=nobody:nobody ./src ./src
RUN npm run build -- --declaration false --removeComments true --sourceMap false
RUN npm prune --omit=dev

FROM myrotvorets/node-min@sha256:911bdb4078743722286b8ff3f5edaf55193e3e5ae4f86d5de4e369050f646bdb
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service
COPY healthcheck.sh /usr/local/bin/
HEALTHCHECK --interval=60s --timeout=10s --start-period=5s --retries=3 CMD ["/usr/local/bin/healthcheck.sh"]
USER nobody:nobody
ENTRYPOINT ["/usr/bin/node", "index.mjs"]
COPY --chown=nobody:nobody ./src/specs ./specs
COPY --chown=nobody:nobody --from=build /srv/service/dist/ ./
COPY --chown=nobody:nobody --from=build /srv/service/node_modules ./node_modules
COPY --chown=nobody:nobody ./package.json ./
