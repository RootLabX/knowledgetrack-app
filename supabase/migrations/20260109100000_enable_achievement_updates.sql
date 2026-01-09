-- Allow authenticated users to update achievements
-- This matches the existing INSERT policy.
-- Note: The application UI restricts this action to admins, but the RLS was missing entirely.

CREATE POLICY "Authenticated users can update achievements"
ON mapper.achievements FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
