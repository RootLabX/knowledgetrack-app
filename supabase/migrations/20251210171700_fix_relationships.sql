-- Add missing foreign key for user_achievements -> auth.users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_achievements_user_id_fkey'
    ) THEN
        ALTER TABLE mapper.user_achievements 
        ADD CONSTRAINT user_achievements_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add missing foreign key for user_objectives -> auth.users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_objectives_user_id_fkey'
    ) THEN
        ALTER TABLE mapper.user_objectives 
        ADD CONSTRAINT user_objectives_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Force schema cache reload by updating descriptions
COMMENT ON TABLE mapper.user_courses IS 'User course assignments and progress';
COMMENT ON TABLE mapper.courses IS 'Educational courses available in the system';
COMMENT ON TABLE mapper.user_achievements IS 'Achievements earned by users';
COMMENT ON TABLE mapper.achievements IS 'Gamification achievements definitions';
