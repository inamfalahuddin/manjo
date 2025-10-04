# --------------------------------------------------------------------------
# STAGE 1: BUILD THE APPLICATION (using golang:1.22-alpine as the base)
# --------------------------------------------------------------------------
FROM golang:1.23-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Copy go.mod and go.sum first to utilize Docker layer caching
# Jika dependensi tidak berubah, langkah ini tidak perlu diulang
COPY go.mod .
COPY go.sum .

# Download Go module dependencies
# --fix: menambahkan missing modules atau menghapus yang tidak digunakan
RUN go mod download && go mod verify

# Copy the rest of the application source code
COPY . .

# Build the Go application
# -o /qr-service: nama file binary output
# cmd/main.go: path ke file utama (sesuai struktur MVC yang kita sepakati)
RUN go build -ldflags "-s -w" -o /qr-service cmd/main.go

# --------------------------------------------------------------------------
# STAGE 2: CREATE THE FINAL, SMALLER IMAGE (using a minimalist base)
# --------------------------------------------------------------------------
FROM alpine:latest

# Set working directory to root
WORKDIR /root/

# Copy the compiled binary from the 'builder' stage
# Binary ini sudah mandiri (static linked) dan tidak butuh Go runtime
COPY --from=builder /qr-service .

# Expose port 3000 (sesuai dengan app.Listen(":3000") di main.go)
EXPOSE 3000

# Command untuk menjalankan aplikasi
# Ketika container dimulai, ia akan menjalankan file binary /qr-service
CMD ["./qr-service"]