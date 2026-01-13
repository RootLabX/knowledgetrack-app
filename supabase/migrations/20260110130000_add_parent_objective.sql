-- Add parent_id to strategic_objectives for hierarchical structure
ALTER TABLE mapper.strategic_objectives
ADD COLUMN parent_id UUID REFERENCES mapper.strategic_objectives(id) ON DELETE SET NULL;

-- Index for better performance on hierarchical queries
CREATE INDEX idx_strategic_objectives_parent_id ON mapper.strategic_objectives(parent_id);
