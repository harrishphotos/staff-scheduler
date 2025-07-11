# Staff Scheduler

A staff management and scheduling platform built with a modern microservices architecture. This project demonstrates scalable backend design, a type-safe frontend, and cloud-ready deployment.

**Live Demo:** [https://staffscheduler.software/](https://staffscheduler.software/)

---

## Architecture Overview

```
+---------------------------+
|   Frontend (React + Vite) |
+---------------------------+
            |
            v
+--------------------+
|   API Gateway (Go) |
+--------------------+
   |           |           |
   v           v           v
+-----------+ +-----------+ +-------------------+
| Employee  | |  Auth     | |  (Future:         |
| Service   | |  Service  | |  Appointment Svc) |
|   (Go)    | |   (Go)    | |      (Go)         |
+-----------+ +-----------+ +-------------------+
     |             |
     v             v
+----------------------------+
|   PostgreSQL DBs (Neon)    |
+----------------------------+

[Shared libraries for DB, logging, and utilities are used across all Go services.]
```

- **Frontend:** React + TypeScript + Vite
- **Backend:** Go microservices (API Gateway, Employee Service, Auth Service) using Fiber and GORM
- **Database:** PostgreSQL (Neon)
- **DevOps:** Docker, Docker Compose

---

## Why This Architecture?

- **Separation of Concerns:** Auth and employee logic are decoupled for security, maintainability, and scalability. Each service can evolve and scale independently.
- **API Gateway:** Centralizes routing, authentication, and cross-cutting concerns, making it easy to add or update backend services without frontend changes.
- **Go for Backend:** Chosen for its performance, simplicity, and concurrency support—ideal for scalable microservices.
- **Microservices:** Each domain (auth, employee, future appointment service) is isolated, enabling independent development, deployment, and scaling.

---

## Features

- Scalable microservices architecture
- API Gateway as a single entry point
- Type-safe, fast frontend
- Docker Compose for local development
- Health checks and environment-based config
- Shared code for DB and logging

---

## How It Works

1. Users interact with the frontend (React app).
2. The frontend sends API requests to the API Gateway.
3. The API Gateway forwards requests to the appropriate backend service.
4. Each backend service handles its own domain logic and database operations.
5. Responses are sent back through the gateway to the frontend.

---

## Getting Started

Clone the repository and start all services with Docker Compose:

```bash
git clone https://github.com/yourusername/staff-scheduler.git
cd staff-scheduler
docker-compose up --build
```

- API Gateway: [http://localhost:8081](http://localhost:8081)
- Frontend: [http://localhost:3000](http://localhost:3000) (or as configured)

---

## Hosting & Cold Start Challenges

### Struggles with Backend Hosting

Deploying Go microservices on cloud platforms (especially with serverless or container-based solutions) introduced cold start latency. We observed that after periods of inactivity, the backend services would take several seconds to respond to the first request, impacting user experience.

#### Troubleshooting & Solutions

- **Connection Pooling:** Ensured database connections are efficiently pooled and reused, reducing reconnection delays.
- **Health Checks:** Implemented health endpoints and periodic pings to keep services warm.
- **Cloud Platform Tuning:** Adjusted platform-specific settings (like minimum instances or container concurrency) to reduce spin-up time.
- **Logging & Monitoring:** Added detailed logs and metrics to identify bottlenecks and verify improvements.

Despite these efforts, some cold start delay is inherent to certain hosting models. We continue to monitor and optimize for faster readiness.

---

## Contributing

Contributions are welcome! To contribute:

1. Fork this repository.
2. Create a new branch for your feature or bugfix.
3. Make your changes and add tests if applicable.
4. Ensure all services build and tests pass.
5. Submit a pull request with a clear description of your changes.

For major changes, please open an issue first to discuss what you would like to change.

---

## Future Enhancements

- **Appointment Service:** Planned addition, easily integrated via the API Gateway.
- Features like request rate limiting, response caching, and circuit breaking are also planned for the gateway.

---

## License

This project is for demonstration and portfolio purposes.

---

For more information or to see the app in action, visit [https://staffscheduler.software/](https://staffscheduler.software/)
