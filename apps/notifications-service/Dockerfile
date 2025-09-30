# ==== BUILDER ====
FROM golang:1.25.1-alpine3.22 AS builder

WORKDIR /app

COPY go.mod .
COPY go.sum .

RUN go mod download

COPY . .

RUN go build -o /app/bin/file  /app/main.go

# ==== RUNNER ====
FROM golang:1.23

WORKDIR /app

COPY --from=builder /app/bin/file /app/bin/file

CMD ["/app/bin/file"]