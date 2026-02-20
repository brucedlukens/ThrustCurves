# ThrustCurves

A frontend-only React + Vite + TypeScript app for motorsport telemetry and thrust curve analysis.

## Dev

```bash
npm install
npm run dev
```

## Deployment

The app is currently self-hosted at [curves.blukens.com](https://curves.blukens.com) on a home server via Docker + nginx.

### Key files

- `Dockerfile` — multi-stage build: Node builds the Vite app, nginx serves the `dist/`
- `nginx.conf` — configures nginx inside the container with React Router SPA fallback
- `deploy.sh` — pulls latest from GitHub and rebuilds the container

> These files are not committed to git. If lost, they need to be recreated manually.

### Deploying updates

Push your changes to GitHub, then SSH into the server and run:

```bash
/home/bruce/workspace/ThrustCurves/deploy.sh
```

### Manual rebuild (no pull)

```bash
docker compose -f /ssd/docker/docker-compose.yaml up -d --build thrustcurves
```
