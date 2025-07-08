# GitHub/GitLab Clone Platform

This project is a modular, self-hosted platform inspired by GitHub, GitHub Enterprise Server, and GitLab. It provides a developer-centric web interface for managing repositories, commit metadata, file hierarchies, and submodules, while offering seamless extensibility for custom tooling and integrations.

It uses REST and GraphQL APIs to interact with code repositories and present a unified experience across different providers.

## Architecture Overview

The system consists of a React + TypeScript frontend and a Go-based backend. It is orchestrated via Docker Compose and includes a full infrastructure stack for storage, caching, and observability.

### Frontend

- Built with React, TypeScript, and shadcn/ui
- Implements a GitHub-like interface for browsing repositories, commit history, files, and submodules
- Runs on port `8080`
- Located in `service/frontend`

### Backend

- Written in Go
- Offers REST and GraphQL endpoints
- Connects to GitHub, GitLab, and GitHub Enterprise Server
- Enriches commit and file metadata, supports chunked loading, and handles OAuth2 authentication
- Runs on port `3000`
- Located in `service/backend`

## Infrastructure Components

| Service           | Description                            | Port  |
|-------------------|----------------------------------------|-------|
| postgres          | Persistent storage for repository data | 5432  |
| postgres_exporter | PostgreSQL metrics for Prometheus      | 9187  |
| redis             | In-memory caching layer                | 6379  |
| redis_exporter    | Redis metrics for Prometheus           | 9121  |
| prometheus        | Metric aggregation and querying        | 9090  |
| grafana           | Dashboard interface for metrics        | 3001  |
| cadvisor          | Container resource monitoring          | 8081  |

All services are defined in `database/docker-compose.yml` and orchestrated via Docker Compose.

## Build and Launch

To build all services in parallel:

```bash
docker compose -f database/docker-compose.yml build --parallel
```

### Build the services

```bash
docker compose -f database/docker-compose.yml build --parallel
```

This will start all components defined in the Docker Compose configuration, including the frontend, backend, database, cache, monitoring stack, and exporters.

### Exposed Ports and Access Points

After launching the system, you can access the services at the following addresses:

- **Frontend UI:** http://localhost:8080
  React-based interface for repository browsing and interaction

- **Backend API:** http://localhost:3000
  Handles REST and GraphQL requests, including repository data and commit metadata

- **PostgreSQL:** localhost:5432
  Stores persistent repository and authentication data (accessible via DB clients)

- **Redis:** localhost:6379
  In-memory cache for transient data and metadata enrichment

- **Prometheus:** http://localhost:9090
  Aggregates metrics from services and exporters for internal monitoring

- **Grafana:** http://localhost:3001
  Default login: `admin` / `admin`
  Preconfigured dashboards for system performance and database analytics

- **cAdvisor:** http://localhost:8081
  Container-level resource monitoring including CPU, memory, and network usage

### Health Checks and Service Dependencies

Each service is equipped with healthchecks to ensure proper startup sequencing. For example:

- The frontend waits until the backend is healthy before starting
- The backend waits for both PostgreSQL and Redis to be responsive
- Exporters for Redis and PostgreSQL depend on their respective services
- Grafana relies on Prometheus for data sources

These conditions help avoid failed requests during boot-up and ensure consistent orchestration.

### Volumes and Persistence

The following Docker volumes are defined for data and logs:

- `pgdata`: persistent PostgreSQL data
- `grafana_data`: Grafana dashboards and configuration
- `prometheus_data`: Prometheus metrics database
- `backend_logs`: backend service logs
- `redis-data`: persistent Redis cache store

This ensures that even after container restarts, your metrics, dashboards, logs, and repository state are retained.
