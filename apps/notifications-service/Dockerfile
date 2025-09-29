# ==== BUILDER ====
FROM golang:1.25.1-alpine3.22 AS builder

WORKDIR /app

COPY go.mod .
COPY go.sum .

RUN go mod download

COPY . .

RUN go build -o /app/bin/file  /app/cmd/notifications-service


# ==== RUNNER ====
FROM golang:1.23

WORKDIR /app

COPY --from=builder /app/bin/file /app/notifications-service

CMD ["/app/notifications-service"]