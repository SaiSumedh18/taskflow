# TaskFlow

TaskFlow is a full-stack team task management platform built with React, TypeScript, Node.js, Express.js, and PostgreSQL.

Users can create projects, collaborate with team members, assign tasks, set priorities and deadlines, and track work through a Kanban-style workflow.

## Live Demo

**Application:** https://taskflow-1cd4.onrender.com

**Backend API:** https://taskflow-api-8lex.onrender.com

**API Health Check:** https://taskflow-api-8lex.onrender.com/api/health

**GitHub Repository:** https://github.com/SaiSumedh18/taskflow

## Screenshots

### Login / Registration

![TaskFlow Login](docs/screenshots/taskflow-login.png)

### Dashboard

![TaskFlow Dashboard](docs/screenshots/taskflow-dashboard.png)

### Project Kanban Board

![TaskFlow Kanban Board](docs/screenshots/taskflow-kanban.png)

## Features

### Authentication

- User registration and login
- bcrypt password hashing
- JWT-based authentication
- Protected backend routes
- Persistent browser sessions
- Per-user authorization

### Project Management

- Create projects
- View owned projects
- View projects shared with the current user
- Project ownership
- OWNER and MEMBER roles
- Team membership management

### Team Collaboration

Project owners can:

- Add registered users to a project by email
- Remove project members
- View member roles
- Assign tasks to project members

Members can access shared projects while owner-only operations remain protected.

When a project member is removed, tasks assigned to that user automatically become unassigned.

### Task Management

Users can:

- Create tasks
- Edit tasks
- Delete tasks
- Assign tasks to project members
- Leave tasks unassigned
- Set due dates
- Set priorities
- Update task status

Supported priorities:

- LOW
- MEDIUM
- HIGH

### Kanban Workflow

Tasks move through three workflow stages:

```text
TODO
  ↓
IN PROGRESS
  ↓
DONE
```

Tasks are displayed in a responsive Kanban-style project board.

### Search and Filtering

Tasks can be searched and filtered by:

- Title
- Description
- Status
- Priority
- Assignee
- Unassigned tasks

Multiple filters can be combined.

### Automated Testing

The backend includes automated API tests using Vitest and Supertest.

The test suite covers:

- API health checks
- User registration
- Password hashing
- Duplicate email prevention
- Login
- JWT-protected routes
- Project creation
- Project ownership
- Task creation
- Task updates
- Task filtering
- Task deletion

A separate PostgreSQL test database is used so automated tests do not modify development data.

### Continuous Integration

GitHub Actions automatically runs on pushes and pull requests to `main`.

The CI pipeline:

- Installs backend dependencies
- Starts a PostgreSQL service
- Loads the database schema
- Builds the backend
- Runs automated API tests
- Installs frontend dependencies
- Builds the React application

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- CSS

### Backend

- Node.js
- Express.js
- TypeScript
- Zod
- bcrypt
- JSON Web Tokens

### Database

- PostgreSQL
- node-postgres (`pg`)

### Testing

- Vitest
- Supertest

### DevOps and Infrastructure

- Docker
- Docker Compose
- Git
- GitHub
- GitHub Actions
- Render

## Architecture

### Application Architecture

```text
Browser
   |
   v
React + TypeScript
Render Static Site
   |
   | HTTPS / REST API
   v
Node.js + Express
Render Web Service
   |
   | SQL
   v
PostgreSQL
Render Managed Database
```

### Authentication Flow

```text
User
 |
 v
Register / Login
 |
 v
Express API
 |
 +---- bcrypt password verification
 |
 +---- JWT generation
 |
 v
Authenticated request
 |
 v
Protected API routes
```

### Project and Task Relationships

```text
User
 |
 +---- owns ----------> Project
 |                       |
 +---- membership -----> |
                         |
                         v
                   Project Members
                         |
                         v
                       Tasks
                         |
                         +---- created by ---> User
                         |
                         +---- assigned to --> User
```

## Project Structure

```text
taskflow/
|
├── .github/
│   └── workflows/
│       └── ci.yml
|
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── types/
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
|
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   ├── sql/
│   │   └── schema.sql
│   ├── tests/
│   │   ├── api.test.ts
│   │   └── setup.ts
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── vitest.config.ts
|
├── docs/
│   └── screenshots/
|
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

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

TaskFlow is deployed using Render.

### Frontend

React and Vite are deployed as a Render Static Site:

```text
https://taskflow-1cd4.onrender.com
```

The frontend uses React Router and a Render rewrite rule so routes such as `/dashboard` and `/projects/:id` can be loaded directly.

### Backend

The Express API runs as a Render Web Service:

```text
https://taskflow-api-8lex.onrender.com
```

The production frontend URL is supplied to the backend through the `CLIENT_URL` environment variable for CORS configuration.

### Database

Production data is stored in a managed PostgreSQL database on Render.

Database credentials and JWT secrets are stored using Render environment variables and are not committed to the repository.

## Continuous Integration

The workflow is located at:

```text
.github/workflows/ci.yml
```

GitHub Actions runs automatically when code is pushed to `main` or when a pull request targets `main`.

Both the frontend build and backend test pipeline must succeed for the CI workflow to pass.

## Future Improvements

Potential future enhancements include:

- Drag-and-drop Kanban cards
- Email-based project invitations
- Activity history
- Real-time updates
- Notifications
- Project analytics
- Pagination
- Dark mode
- Expanded integration testing
## Java 21 / Spring backend upgrade (2026-10-03)

The default Compose backend is now `spring-server/`: Spring Boot 3.5.16, Spring Security JWT resource server, BCrypt, Spring Data JPA/Hibernate, PostgreSQL, Jakarta validation and JUnit 5/MockMvc. The working Node implementation remains in `server/`; `docker-compose.node.yml` preserves its rollback configuration. Original databases were not migrated or modified during verification.

```mermaid
flowchart LR
 React --> Nginx[Nginx /api proxy]
 Nginx --> Security[Spring Security / HS256 JWT]
 Security --> API[REST controllers / validation]
 API --> Service[Transactional authorization + task/member service]
 Service --> JPA[Spring Data JPA / Hibernate]
 JPA --> PG[(PostgreSQL)]
```

Existing `/api/auth`, projects, memberships and task endpoints retain camelCase inputs and snake_case outputs, including role, creator/assignee names, and timestamps. React UX remains intact. Backend filtering supports status/priority and literal case-insensitive `search`. Project creation and OWNER membership are atomic. Project-row locks serialize membership/task mutations, and task-row locks protect updates; removing a member atomically clears assignments. Only OWNER can manage memberships. Any current member can create/update/delete tasks, matching the original behavior. Removed members lose access despite retaining a valid token.

### Run, verify, rollback

- Install Java **21** and Maven 3.9+. In `spring-server`, set JDBC_URL (for example `jdbc:postgresql://localhost:5433/taskflow`), DB_USER, DB_PASSWORD, JWT_SECRET (at least 32 UTF-8 bytes), CLIENT_URL, and optional PORT (4000). Run `mvn spring-boot:run`.
- Schema stays compatible with the original SQL. Production defaults to Hibernate validation and no automatic schema creation. Initialize a new empty database using `server/sql/schema.sql`, or set DB_INIT=always only for local initialization. Never enable destructive Hibernate schema modes on live databases.
- JWT expiry defaults to 7 days; configure JWT_EXPIRES_SECONDS. Existing Node HS256 tokens with `userId` work if the same sufficiently long secret is used; shorter secrets require rotation and sign-in again. BCrypt $2b$ hashes are supported. New passwords are limited to 72 UTF-8 bytes to avoid silent truncation.
- `docker compose -f docker-compose.yml up -d --build` uses Spring. Set VITE_API_URL=/api for the new frontend proxy and CLIENT_URL to the frontend origin. Review existing .env values; .env was preserved, not overwritten.
- Roll back with `docker compose -f docker-compose.node.yml up -d --build`. Keep the same database and JWT secret where compatible. The Node files remain functional.
- Isolated Docker verification: `docker compose -p taskflow-upgrade-verify -f compose.spring.verify.yml up -d --build --wait` (React 8092/API 4194/PostgreSQL 5497). Run `mvn -B spotless:check verify` with TEST_JDBC_URL=`jdbc:postgresql://localhost:5497/taskflow_test`, TEST_DB_USER=taskflow and TEST_DB_PASSWORD=local-test-only. Tests refuse any database other than `taskflow_test` and clear it.
- Backend format check: Spotless/google-java-format. Frontend: npm ci, npm run lint, npm run build. CI retains the legacy Node checks and adds Java 21 Spring tests/package/format and Docker image build. [GitHub Actions passed](https://github.com/SaiSumedh18/taskflow/actions/runs/37158076864) for the implementation commit.

### Verified benchmark: 5,000 synthetic persisted tasks

| Operation | Concurrent VUs | p50 ms | p95 ms | Requests/sec | HTTP error rate |
|---|---:|---:|---:|---:|---:|
| Full 5,000-task retrieval | 5 | 54.447 | 142.8454 | 75.55 | 0% |
| TODO + HIGH filter | 5 | 7.847 | 21.1878 | 498.33 | 0% |
| Kanban status update | 5 | 3.3035 | 14.6235 | 936.70 | 0% |

Method: Java 21.0.12.1, Spring Boot 3.5.16, native PostgreSQL 16.3 in a separate `taskflow_benchmark` database, macOS arm64, k6 2.3.0. `benchmarks/seed.sql` refuses non-benchmark databases and seeds one user/project/owner plus 5,000 tasks. Each sequential run uses five constant VUs for 30 seconds without think time, at localhost port 4195 (final update run: 4196). Before each run, 20 GET requests warm the JVM/query path (the update run warms GET, not PATCH). Full retrieval returns all records; filtered retrieval uses status=TODO&priority=HIGH (~833 tasks); update repeatedly patches task 1 to IN_PROGRESS under project/task locks. The update endpoint was remeasured after fixing overlapping patches to preserve unrelated fields, with a fresh JVM and concurrent Docker build activity; full/filter routes were unchanged. All requests check status 200. JWT signing is local/synthetic and no token is committed. Raw k6 summaries are in `benchmarks/results`. These measurements use a concurrent workload and are not directly comparable to the older README numbers; no speedup is claimed.

Verified: 31/31 JUnit/MockMvc integration tests pass on Java 21 against PostgreSQL, including a final Docker-backed database run; original Node tests pass 7/7 in a separate database. Java package and formatting checks pass. Frontend lint/build pass. Spring/frontend Docker builds and isolated full Compose/API smoke pass.

Limitations: full-list API returns all tasks for compatibility; pagination is future work. No refresh-token/revocation service, audit log, cloud deployment, or cross-instance stress/failover testing is claimed. Use HTTPS, secret rotation, database backups and operational monitoring before production. JPA entities retain foreign-key IDs with database-enforced relationships; batched user lookup avoids per-task name queries.
