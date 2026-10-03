DO $$ BEGIN
 IF current_database() NOT LIKE '%_benchmark' THEN RAISE EXCEPTION 'Use an isolated benchmark database'; END IF;
END $$;
TRUNCATE users RESTART IDENTITY CASCADE;
INSERT INTO users(name,email,password_hash) VALUES('Benchmark','bench@example.invalid','no-login');
INSERT INTO projects(name,description,owner_id) VALUES('Benchmark','Synthetic only',1);
INSERT INTO project_members(project_id,user_id,role) VALUES(1,1,'OWNER');
INSERT INTO tasks(title,description,status,priority,project_id,created_by,assigned_to,due_date)
SELECT 'Synthetic task '||n,'Benchmark data',CASE WHEN n%3=0 THEN 'DONE' WHEN n%3=1 THEN 'TODO' ELSE 'IN_PROGRESS' END,
CASE WHEN n%2=0 THEN 'HIGH' ELSE 'MEDIUM' END,1,1,1,now()+interval '1 day' FROM generate_series(1,5000)n;
ANALYZE;
