-- Create feedback_360 table in mapper schema
CREATE TABLE IF NOT EXISTS mapper.feedback_360 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL CHECK (relationship IN ('peer', 'manager', 'subordinate')),
    content TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE mapper.feedback_360 ENABLE ROW LEVEL SECURITY;

-- Policies

-- Users can view feedback where they are the recipient
CREATE POLICY "Users can view their own feedback"
ON mapper.feedback_360
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view feedback they wrote (as reviewer)
CREATE POLICY "Reviewers can view feedback they wrote"
ON mapper.feedback_360
FOR SELECT
USING (auth.uid() = reviewer_id);

-- Reviewers can insert feedback
CREATE POLICY "Reviewers can insert feedback"
ON mapper.feedback_360
FOR INSERT
WITH CHECK (auth.uid() = reviewer_id);

-- Grant permissions
GRANT SELECT, INSERT ON mapper.feedback_360 TO authenticated;
GRANT SELECT, INSERT ON mapper.feedback_360 TO "authenticated";
