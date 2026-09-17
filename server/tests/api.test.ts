import request from "supertest";

import {
    afterAll,
    beforeEach,
    describe,
    expect,
    test,
} from "vitest";

import { app } from "../src/app.js";
import { pool } from "../src/config/db.js";

async function registerTestUser() {
    const response =
        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Test User",
                email: "test@example.com",
                password: "Testing123!",
            });

    return response;
}

beforeEach(async () => {
    await pool.query(`
    TRUNCATE TABLE
      tasks,
      project_members,
      projects,
      users
    RESTART IDENTITY CASCADE
  `);
});

afterAll(async () => {
    await pool.end();
});

describe(
    "TaskFlow API",
    () => {
        test(
            "GET /api/health returns API status",
            async () => {
                const response =
                    await request(app)
                        .get("/api/health");

                expect(
                    response.status
                ).toBe(200);

                expect(
                    response.body.success
                ).toBe(true);

                expect(
                    response.body.message
                ).toBe(
                    "TaskFlow API is running"
                );
            }
        );

        test(
            "registers a user and hashes the password",
            async () => {
                const response =
                    await registerTestUser();

                expect(
                    response.status
                ).toBe(201);

                expect(
                    response.body.success
                ).toBe(true);

                expect(
                    response.body.user.email
                ).toBe(
                    "test@example.com"
                );

                expect(
                    response.body.token
                ).toBeTruthy();

                const databaseResult =
                    await pool.query(
                        `
            SELECT
              email,
              password_hash
            FROM users
            WHERE email = $1
            `,
                        [
                            "test@example.com",
                        ]
                    );

                expect(
                    databaseResult.rowCount
                ).toBe(1);

                const storedUser =
                    databaseResult.rows[0];

                expect(
                    storedUser.password_hash
                ).not.toBe(
                    "Testing123!"
                );

                expect(
                    storedUser.password_hash
                ).toMatch(
                    /^\$2[aby]\$/
                );
            }
        );

        test(
            "prevents duplicate email registration",
            async () => {
                await registerTestUser();

                const response =
                    await request(app)
                        .post(
                            "/api/auth/register"
                        )
                        .send({
                            name: "Another User",
                            email:
                                "test@example.com",
                            password:
                                "Testing456!",
                        });

                expect(
                    response.status
                ).toBe(409);

                expect(
                    response.body.success
                ).toBe(false);

                expect(
                    response.body.message
                ).toBe(
                    "An account with this email already exists"
                );
            }
        );

        test(
            "logs in and accesses a protected route",
            async () => {
                await registerTestUser();

                const loginResponse =
                    await request(app)
                        .post(
                            "/api/auth/login"
                        )
                        .send({
                            email:
                                "test@example.com",
                            password:
                                "Testing123!",
                        });

                expect(
                    loginResponse.status
                ).toBe(200);

                expect(
                    loginResponse.body.token
                ).toBeTruthy();

                const token =
                    loginResponse.body.token;

                const meResponse =
                    await request(app)
                        .get("/api/auth/me")
                        .set(
                            "Authorization",
                            `Bearer ${token}`
                        );

                expect(
                    meResponse.status
                ).toBe(200);

                expect(
                    meResponse.body.user.email
                ).toBe(
                    "test@example.com"
                );
            }
        );

        test(
            "rejects protected routes without authentication",
            async () => {
                const response =
                    await request(app)
                        .get(
                            "/api/projects"
                        );

                expect(
                    response.status
                ).toBe(401);

                expect(
                    response.body.success
                ).toBe(false);
            }
        );

        test(
            "creates a project and assigns the creator as OWNER",
            async () => {
                const registerResponse =
                    await registerTestUser();

                const token =
                    registerResponse.body.token;

                const projectResponse =
                    await request(app)
                        .post(
                            "/api/projects"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`
                        )
                        .send({
                            name:
                                "Test Project",
                            description:
                                "Project used for API testing.",
                        });

                expect(
                    projectResponse.status
                ).toBe(201);

                expect(
                    projectResponse.body
                        .project.name
                ).toBe(
                    "Test Project"
                );

                const membershipResult =
                    await pool.query(
                        `
            SELECT role
            FROM project_members
            WHERE project_id = $1
            `,
                        [
                            projectResponse
                                .body.project.id,
                        ]
                    );

                expect(
                    membershipResult
                        .rows[0].role
                ).toBe("OWNER");
            }
        );

        test(
            "creates, updates, filters, and deletes a task",
            async () => {
                const registerResponse =
                    await registerTestUser();

                const token =
                    registerResponse.body.token;

                const userId =
                    registerResponse.body
                        .user.id;

                const projectResponse =
                    await request(app)
                        .post(
                            "/api/projects"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`
                        )
                        .send({
                            name:
                                "Task Test Project",
                            description:
                                "Testing tasks.",
                        });

                const projectId =
                    projectResponse.body
                        .project.id;

                const createTaskResponse =
                    await request(app)
                        .post(
                            `/api/projects/${projectId}/tasks`
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`
                        )
                        .send({
                            title:
                                "Automated test task",
                            description:
                                "Testing task creation.",
                            status: "TODO",
                            priority: "HIGH",
                            assignedTo:
                                userId,
                        });

                expect(
                    createTaskResponse.status
                ).toBe(201);

                expect(
                    createTaskResponse.body
                        .task.status
                ).toBe("TODO");

                expect(
                    createTaskResponse.body
                        .task.priority
                ).toBe("HIGH");

                const taskId =
                    createTaskResponse.body
                        .task.id;

                const updateResponse =
                    await request(app)
                        .patch(
                            `/api/tasks/${taskId}`
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`
                        )
                        .send({
                            status:
                                "IN_PROGRESS",
                            priority:
                                "MEDIUM",
                        });

                expect(
                    updateResponse.status
                ).toBe(200);

                expect(
                    updateResponse.body
                        .task.status
                ).toBe(
                    "IN_PROGRESS"
                );

                expect(
                    updateResponse.body
                        .task.priority
                ).toBe("MEDIUM");

                const filterResponse =
                    await request(app)
                        .get(
                            `/api/projects/${projectId}/tasks?status=IN_PROGRESS&priority=MEDIUM`
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`
                        );

                expect(
                    filterResponse.status
                ).toBe(200);

                expect(
                    filterResponse.body
                        .tasks
                ).toHaveLength(1);

                expect(
                    filterResponse.body
                        .tasks[0].id
                ).toBe(taskId);

                const deleteResponse =
                    await request(app)
                        .delete(
                            `/api/tasks/${taskId}`
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`
                        );

                expect(
                    deleteResponse.status
                ).toBe(200);

                expect(
                    deleteResponse.body
                        .success
                ).toBe(true);

                const taskResult =
                    await pool.query(
                        `
            SELECT id
            FROM tasks
            WHERE id = $1
            `,
                        [taskId]
                    );

                expect(
                    taskResult.rowCount
                ).toBe(0);
            }
        );
    }
);