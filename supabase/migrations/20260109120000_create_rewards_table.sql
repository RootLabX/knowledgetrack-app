-- Create quarterly_rewards table
CREATE TABLE IF NOT EXISTS mapper.quarterly_rewards (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rank integer NOT NULL UNIQUE,
    reward text NOT NULL,
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE mapper.quarterly_rewards ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view rewards" 
ON mapper.quarterly_rewards FOR SELECT 
USING (true);

CREATE POLICY "Admins can update rewards" 
ON mapper.quarterly_rewards FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert rewards" 
ON mapper.quarterly_rewards FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Seed initial data
INSERT INTO mapper.quarterly_rewards (rank, reward) VALUES 
(1, 'Día Libre'),
(2, 'Comida'),
(3, 'Café')
ON CONFLICT (rank) DO NOTHING;
