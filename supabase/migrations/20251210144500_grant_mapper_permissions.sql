-- Grant usage on schema mapper
GRANT USAGE ON SCHEMA mapper TO postgres, anon, authenticated, service_role;

-- Grant all privileges on all tables in schema mapper
GRANT ALL ON ALL TABLES IN SCHEMA mapper TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA mapper TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA mapper TO postgres, anon, authenticated, service_role;

-- Ensure future tables also get these privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA mapper GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA mapper GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA mapper GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
