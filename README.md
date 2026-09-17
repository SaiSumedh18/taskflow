# TaskFlow

TaskFlow is a full-stack team task management platform built with
TypeScript, React, Node.js, Express.js, and PostgreSQL.

It allows users to create projects, collaborate with team members,
assign tasks, manage priorities and deadlines, and track work through
a Kanban-style workflow.

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
- Set due dates
- Set LOW, MEDIUM, or HIGH priority

### Task Workflow
Tasks can move between:

- TODO
- IN PROGRESS
- DONE

Tasks are displayed using a Kanban-style project board.

### Search and Filtering
Tasks can be filtered by:

- Search text
- Status
- Priority
- Assignee
- Unassigned tasks

### Testing
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

### Development / Infrastructure
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




Authentication flow:

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




TaskFlow data relationships:

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




Project Structure

taskflow/
|
├── client/
|   ├── src/
|   |   ├── api/
|   |   ├── components/
|   |   ├── context/
|   |   ├── pages/
|   |   └── types/
|   |
|   └── package.json
|
├── server/
|   ├── src/
|   |   ├── config/
|   |   ├── controllers/
|   |   ├── middleware/
|   |   ├── routes/
|   |   ├── services/
|   |   ├── types/
|   |   └── utils/
|   |
|   ├── sql/
|   ├── tests/
|   └── package.json
|
├── docker-compose.yml
├── .gitignore
└── README.md