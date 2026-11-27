-- RetrySight Core tier — PostgreSQL grants
GRANT ALL PRIVILEGES ON DATABASE agent_retry_core TO retrysight_core;
GRANT ALL PRIVILEGES ON SCHEMA public TO retrysight_core;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO retrysight_core;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO retrysight_core;
