-- Allow users to start courses (insert into user_courses)
CREATE POLICY "Users can start courses" 
ON mapper.user_courses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure users can update their status and extended fields
-- (The existing policy "Users can update own progress" might be restrictive if it was defined on specific columns, 
-- but usually row-level policies apply to the row. We assume the existing update policy is sufficient for the row, 
-- but if we need to be sure, we can ensure it covers the row.)
-- Assuming "Users can update own progress" is: CREATE POLICY ... ON ... FOR UPDATE USING (auth.uid() = user_id);
