# # # # # # # # #

FROM node:alpine AS base

ENV MODULE=cmet-accounts
ENV PROJECT=server


# # #
# BUILDER STAGE

FROM base AS builder

WORKDIR /app

COPY . .

# First install the dependencies (as they change less often)
RUN npm install

RUN npm run build

# # #
# RUNNER STAGE

FROM base AS runner

WORKDIR /app

COPY --from=builder /app /apps/${PROJECT}/dist/ ./apps/${PROJECT}

CMD node src/index.js