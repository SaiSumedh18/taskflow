process.env.PORT = "4001";

process.env.DATABASE_URL =
    "postgresql://taskflow:taskflow_password@localhost:5433/taskflow_test";

process.env.JWT_SECRET =
    "taskflow-test-secret";

process.env.JWT_EXPIRES_IN =
    "1h";