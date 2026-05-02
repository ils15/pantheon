---
description: "Infrastructure standards for Docker and deployment"
name: "Infrastructure Standards"
applyTo: "**/{Dockerfile,docker-compose.yml,*.yml,*.yaml}"
---

# Infrastructure Standards (Prometheus)

## Docker Images
- Use multi-stage builds
- Minimize image layers
- Non-root user (never RUN as root)
- Health checks (HEALTHCHECK instruction)
- Slim/Alpine bases where possible

## Compose Files
- Service dependencies declared
- Resource limits (memory, cpu)
- Restart policies (unless-stopped)
- Named volumes for persistence
- Network configuration

## Environment Configuration
- Never hardcode secrets
- .env files for development
- Environment variables for production
- Separate configs: dev/staging/prod

## CI/CD
- Automated testing before deploy
- Build on every commit
- Deploy on tagged releases
- Staging environment as gate

## Monitoring
- Healthcheck endpoints
- Log aggregation
- Metrics collection
- Alerts for errors/timeouts

## Scaling
- Stateless containers
- Horizontal scaling support
- Load balancer configuration
- Database connection pooling
