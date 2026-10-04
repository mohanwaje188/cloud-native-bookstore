# Cloud-Native Online Bookstore
React + Node/Express + MongoDB. Dev side is done; DevOps work (Jenkins, ECR, Terraform, Kubernetes, monitoring) is added on top.

## Run locally with Docker
    docker compose up --build
Open http://localhost:8080 (Register, then browse, add to cart, order).

## Backend endpoints
GET /health, GET /metrics (Prometheus), GET /api/books?q=, GET /api/books/:id, POST /api/register, POST /api/login, POST|GET /api/orders (auth)

## Run tests
    cd backend && npm install && npm test

## DevOps TODO
Jenkinsfile, ECR push, Terraform (AWS), k8s manifests + HPA, Prometheus + Grafana.
