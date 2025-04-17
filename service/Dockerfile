# Basis-Image für Go
FROM golang:1.24 AS builder

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Module kopieren und Abhängigkeiten installieren
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Quellcode kopieren und bauen
COPY backend/ .
RUN go build -o server

# Basic image for node.js (create fontend build)
FROM node:20 AS frontend_builder
WORKDIR /frontend
COPY frontend ./
RUN npm install && npm run build

FROM golang:1.24
WORKDIR /app

# Copy the compiler go-server in the end image
COPY --from=builder /app/server /app/server

# Copy the frontend built in the previous step
COPY --from=frontend_builder /frontend/out /app/static

# Expose the port for the gin server
EXPOSE 8080

# Start the web application
CMD ["/app/server"]
