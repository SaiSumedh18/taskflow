# TaskFlow

TaskFlow is a full-stack team task management platform built with TypeScript, React, Node.js, Express.js, and PostgreSQL.

It allows users to create projects, collaborate with team members, assign tasks, manage priorities and deadlines, and track work through a Kanban-style workflow.

## Features

### Authentication

- User registration and login
- bcrypt password hashing
- JWT-based authentication
- Protected API routes
- Persistent browser sessions

### Project Management

- Create projects
- View owned and shared projects
- Project ownership
- Team membership
- OWNER and MEMBER roles
- Add and remove project members

### Task Management

- Create tasks
- Edit tasks
- Delete tasks
- Assign tasks to project members
- Set task due dates
- Set LOW, MEDIUM, or HIGH priority
- Assign and unassign tasks

### Task Workflow

Tasks move through three workflow stages:

- TODO
- IN PROGRESS
- DONE

Tasks are displayed using a Kanban-style project board.

### Search and Filtering

Tasks can be searched and filtered by:

- Task title or description
- Status
- Priority
- Assignee
- Unassigned tasks

### Team Management

Project owners can:

- Add members by email
- Remove members
- View project members
- View OWNER and MEMBER roles

When a project member is removed, tasks assigned to that member are automatically changed to unassigned.

### Automated Testing

The backend includes automated API tests covering:

- Health endpoint
- User registration
- Password hashing
- Duplicate-email prevention
- Login
- JWT-protected routes
- Project creation
- Project ownership
- Task creation
- Task updates
- Task filtering
- Task deletion

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Axios

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

### Development and Infrastructure

- Docker
- Docker Compose
- Git
- GitHub

## Architecture

```text
React + TypeScript
        |
        | REST API
        v
Node.js + Express
        |
        | SQL
        v
PostgreSQL
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
 v
bcrypt + JWT
 |
 v
Protected Routes
```

### Data Relationships

```text
User
 |
 +---- owns ----> Project
 |
 +---- joins ---> Project Membership
                    |
                    v
                  Project
                    |
                    v
                   Task
                    |
                    +---- assigned to ---> User
```

## Project Structure

```text
taskflow/
|
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── types/
│   ├── .env.example
│   └── package.json
|
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── sql/
│   │   └── schema.sql
│   ├── tests/
│   ├── .env.example
│   └── package.json
|
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Local Development

### Requirements

Make sure the following are installed:

- Node.js
- npm
- Docker
- Docker Compose
- Git

### 1. Clone the Repository

```bash
git clone <https://github.com/SaiSumedh18/taskflow>
cd taskflow
```

> `<repository-url>` will be replaced with the actual GitHub repository URL after the repository is published.

### 2. Start PostgreSQL

```bash
docker compose up -d
```

Verify the database container is running:

```bash
docker compose ps
```

### 3. Configure the Backend

Copy the example environment file:

```bash
cp server/.env.example server/.env
```

The backend environment file should contain values similar to:

```env
PORT=4000
DATABASE_URL=postgresql://taskflow:your_password@localhost:5433/taskflow
JWT_SECRET=replace-with-a-secure-secret
JWT_EXPIRES_IN=7d
```

Never commit the real `.env` file.

### 4. Create the Database Tables

Run:

```bash
docker exec -i taskflow-postgres \
psql -U taskflow -d taskflow \
< server/sql/schema.sql
```

### 5. Install and Start the Backend

```bash
cd server
npm install
npm run dev
```

The backend API runs at:

```text
http://localhost:4000
```

Health endpoint:

```text
http://localhost:4000/api/health
```

### 6. Configure the Frontend

Open another terminal and return to the project folder:

```bash
cd ~/Downloads/taskflow
```

Copy the frontend environment file:

```bash
cp client/.env.example client/.env
```

The frontend environment file should contain:

```env
VITE_API_URL=http://localhost:4000/api
```

### 7. Install and Start the Frontend

```bash
cd client
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

## Running Automated Tests

TaskFlow uses a separate PostgreSQL test database so automated tests do not modify development data.

### Create the Test Database

```bash
docker exec taskflow-postgres \
psql -U taskflow -d postgres \
-c "CREATE DATABASE taskflow_test;"
```

### Load the Database Schema

From the TaskFlow root directory:

```bash
docker exec -i taskflow-postgres \
psql -U taskflow -d taskflow_test \
< server/sql/schema.sql
```

### Run the Tests

```bash
cd server
npm test
```

The current automated test suite verifies authentication, authorization, projects, tasks, filtering, and database behavior.

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

### Task Filtering

The project task endpoint supports filtering by status and priority.

Examples:

```text
GET /api/projects/1/tasks?status=TODO
GET /api/projects/1/tasks?priority=HIGH
GET /api/projects/1/tasks?status=IN_PROGRESS&priority=MEDIUM
```

## Security

TaskFlow currently implements:

- bcrypt password hashing
- JWT authentication
- Protected API routes
- Project membership authorization
- Project owner authorization for member management
- Parameterized PostgreSQL queries
- Environment variables for sensitive configuration

Real `.env` files are excluded from Git and should never be committed.

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

## Future Improvements

Potential future improvements include:

- Drag-and-drop Kanban cards
- Email project invitations
- Activity history
- Real-time notifications
- Project analytics
- Dark mode
- Expanded automated test coverage
- Production deployment