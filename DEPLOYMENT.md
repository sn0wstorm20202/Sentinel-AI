# Deployment Guide - Sentinel AI

This guide details how to deploy Sentinel AI to a production environment.

## Prerequisites
- Docker (v24+)
- Docker Compose (v2+)
- Git

## Single Node Deployment
1. **Clone the Repository:**
   ```bash
   git clone <repository_url>
   cd Sentinel-AI
   ```
2. **Environment Variables:**
   Copy the example template and adjust values if necessary (defaults are safe for local deployment).
   ```bash
   cp .env.example .env
   ```
3. **Start the Platform:**
   ```bash
   docker compose up -d --build
   ```
4. **Access the Application:**
   Open `http://localhost:8080` in your browser. Nginx will correctly route your traffic.

## Scaling Up
- To increase backend concurrency, modify the `WORKERS` variable in `.env` (e.g., `WORKERS=8`).
- For multi-node deployments (e.g., Kubernetes), refer to the individual Dockerfiles and configure an ingress controller to mimic the provided `nginx.conf` routing logic.
