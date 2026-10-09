# TaskFlow — development guide

> The default backend is now the Java / Spring Boot service in `spring-server/`. For running it, see [engineering notes](ENGINEERING_NOTES.md#run-verify-rollback). The steps below also cover the original Node.js backend in `server/`, which is kept as a working fallback.

## Local Development

### Requirements

Install:

- Node.js
- npm
- Docker
- Docker Compose
- Git

### Clone the Repository

```bash
git clone https://github.com/SaiSumedh18/taskflow.git
cd taskflow
```

## Option 1: Run the Full Application with Docker

TaskFlow can run as three Docker services:

- PostgreSQL
- Express backend
- React frontend served through Nginx

Create the Docker environment file:

```bash
cp .env.example .env
```

Generate a secure JWT secret:

```bash
openssl rand -hex 32
```

Place the generated value in `.env`.

Start the entire application:

```bash
docker compose up --build -d
```

Check the services:

```bash
docker compose ps
```

The application will be available at:

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:4000

API Health:
http://localhost:4000/api/health

PostgreSQL:
localhost:5433
```

Stop the application:

```bash
docker compose down
```

## Option 2: Run Frontend and Backend Manually

### Start PostgreSQL

From the project root:

```bash
docker compose up -d postgres
```

### Configure the Backend

Copy the environment template:

```bash
cp server/.env.example server/.env
```

Example configuration:

```env
PORT=4000
DATABASE_URL=postgresql://taskflow:your_password@localhost:5433/taskflow
JWT_SECRET=replace-with-a-secure-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Never commit the real `.env` file.

### Initialize the Database

```bash
docker exec -i taskflow-postgres \
psql -U taskflow -d taskflow \
< server/sql/schema.sql
```

### Start the Backend

```bash
cd server
npm install
npm run dev
```

The API will run at:

```text
http://localhost:4000
```

### Configure the Frontend

From the project root:

```bash
cp client/.env.example client/.env
```

The frontend environment file should contain:

```env
VITE_API_URL=http://localhost:4000/api
```

### Start the Frontend

```bash
cd client
npm install
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

## Running Automated Tests

TaskFlow uses a separate PostgreSQL database for automated tests.

Create the test database:

```bash
docker exec taskflow-postgres \
psql -U taskflow -d postgres \
-c "CREATE DATABASE taskflow_test;"
```

Load the schema:

```bash
docker exec -i taskflow-postgres \
psql -U taskflow -d taskflow_test \
< server/sql/schema.sql
```

Run the tests:

```bash
cd server
npm test
```

## Build Commands

### Backend

```bash
cd server
npm run build
```

### Frontend

```bash
cd client
npm run build
```

## API Overview

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Projects

```text
POST /api/projects
GET  /api/projects
GET  /api/projects/:id
```

### Project Members

```text
GET    /api/projects/:id/members
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId
```

### Tasks

```text
POST   /api/projects/:projectId/tasks
GET    /api/projects/:projectId/tasks

GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
```

### Task Filtering API

The backend supports filtering project tasks by status and priority.

Examples:

```text
GET /api/projects/1/tasks?status=TODO

GET /api/projects/1/tasks?priority=HIGH

GET /api/projects/1/tasks?status=IN_PROGRESS&priority=MEDIUM
```

## Security

TaskFlow implements:

- bcrypt password hashing
- JWT authentication
- Protected API routes
- Project membership authorization
- Project owner authorization
- Parameterized PostgreSQL queries
- Environment-based configuration
- Production CORS restrictions
- Separate frontend and backend deployment configuration

Sensitive `.env` files are excluded from Git.

## Deployment

The public demo runs on Render (free tier) with the Spring Boot backend and a PostgreSQL database on Neon: https://sai-taskflow-demo.onrender.com

Database credentials and the JWT secret live in the hosting provider's environment settings and are never committed.

## Continuous Integration

The workflow is located at:

```text
.github/workflows/ci.yml
```

GitHub Actions runs automatically when code is pushed to `main` or when a pull request targets `main`.

Both the frontend build and backend test pipeline must succeed for the CI workflow to pass.
