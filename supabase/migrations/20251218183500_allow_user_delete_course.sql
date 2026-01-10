-- Allow users to un-assign themselves (reset progress to 0/Disponible)
-- This deletes the record from user_courses
CREATE POLICY "Users can delete own assignments" 
ON mapper.user_courses 
FOR DELETE 
USING (auth.uid() = user_id);
