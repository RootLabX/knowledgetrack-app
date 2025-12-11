-- Explicitly recreate Foreign Keys with specific names to resolve PGRST200 errors

-- 1. user_courses -> courses
ALTER TABLE mapper.user_courses DROP CONSTRAINT IF EXISTS user_courses_course_id_fkey;
ALTER TABLE mapper.user_courses DROP CONSTRAINT IF EXISTS fk_user_courses_courses;

ALTER TABLE mapper.user_courses
ADD CONSTRAINT fk_user_courses_courses
FOREIGN KEY (course_id)
REFERENCES mapper.courses(id)
ON DELETE CASCADE;

-- 2. user_achievements -> achievements
ALTER TABLE mapper.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_achievement_id_fkey;
ALTER TABLE mapper.user_achievements DROP CONSTRAINT IF EXISTS fk_user_achievements_achievements;

ALTER TABLE mapper.user_achievements
ADD CONSTRAINT fk_user_achievements_achievements
FOREIGN KEY (achievement_id)
REFERENCES mapper.achievements(id)
ON DELETE CASCADE;

-- 3. Force schema cache reload by commenting on the new constraints
COMMENT ON CONSTRAINT fk_user_courses_courses ON mapper.user_courses IS 'Foreign key linking to courses';
COMMENT ON CONSTRAINT fk_user_achievements_achievements ON mapper.user_achievements IS 'Foreign key linking to achievements';
