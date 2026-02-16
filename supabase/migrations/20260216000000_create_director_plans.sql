-- Create director_plans table for the Kanban-style planner
CREATE TABLE IF NOT EXISTS director_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'planning', 'in_progress', 'done')),
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_director_plans_status ON director_plans(status);
CREATE INDEX IF NOT EXISTS idx_director_plans_created_by ON director_plans(created_by);

-- Enable RLS
ALTER TABLE director_plans ENABLE ROW LEVEL SECURITY;

-- Directors can view all plans
CREATE POLICY "Directors can view plans"
  ON director_plans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'director'
    )
  );

-- Directors can insert plans
CREATE POLICY "Directors can insert plans"
  ON director_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'director'
    )
  );

-- Directors can update plans
CREATE POLICY "Directors can update plans"
  ON director_plans FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'director'
    )
  );

-- Directors can delete plans
CREATE POLICY "Directors can delete plans"
  ON director_plans FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'director'
    )
  );

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_director_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_director_plans_updated_at
  BEFORE UPDATE ON director_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_director_plans_updated_at();
