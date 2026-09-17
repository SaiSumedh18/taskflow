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