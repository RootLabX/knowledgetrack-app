-- Add DELETE policy for quarterly_rewards
CREATE POLICY "Admins can delete rewards" 
ON mapper.quarterly_rewards FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);
