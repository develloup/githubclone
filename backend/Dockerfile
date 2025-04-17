# Basis-Image für Go
FROM golang:1.24

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Module kopieren und Abhängigkeiten installieren
COPY go.mod go.sum ./
RUN go mod download

# Quellcode kopieren und bauen
COPY . .
RUN go build -o server

# Exponiere den Port für Gin
EXPOSE 8080

# Starte die Anwendung
CMD ["/app/server"]
