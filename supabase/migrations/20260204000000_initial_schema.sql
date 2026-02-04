-- Outcome Tracking Dashboard - Initial Schema
-- Migration: 20260204000000_initial_schema.sql

-- ============================================
-- ENUM TYPES
-- ============================================

-- Outcome status enum
CREATE TYPE outcome_status AS ENUM ('Active', 'Stalled', 'Completed');

-- Outcome level enum
CREATE TYPE outcome_level AS ENUM ('Org', 'Departmental');

-- Cascade alignment enum
CREATE TYPE cascade_alignment AS ENUM (
  'WinningAspiration',
  'WhereToPlay',
  'HowToWin',
  'Capabilities',
  'ManagementSystems'
);

-- Experiment/Task status enum
CREATE TYPE experiment_status AS ENUM ('Backlog', 'InProgress', 'Done');

-- Task status (same values as experiment_status but separate type for clarity)
CREATE TYPE task_status AS ENUM ('Backlog', 'InProgress', 'Done');

-- RACI role enum
CREATE TYPE raci_role AS ENUM ('Responsible', 'Accountable', 'Support', 'Consulted', 'Informed');

-- Entity type enum (for polymorphic relationships)
CREATE TYPE entity_type AS ENUM ('Outcome', 'Experiment');

-- ============================================
-- TABLES
-- ============================================

-- Outcomes table
CREATE TABLE outcomes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status outcome_status NOT NULL DEFAULT 'Active',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  metrics JSONB,
  cascade_alignment cascade_alignment[] NOT NULL DEFAULT '{}',
  level outcome_level NOT NULL DEFAULT 'Org',
  parent_outcome_id INTEGER REFERENCES outcomes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Experiments table
CREATE TABLE experiments (
  id SERIAL PRIMARY KEY,
  outcome_id INTEGER NOT NULL REFERENCES outcomes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status experiment_status NOT NULL DEFAULT 'Backlog',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  inputs JSONB,
  scope JSONB,
  spec TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- RACI table (polymorphic relationship to outcomes or experiments)
CREATE TABLE raci (
  id SERIAL PRIMARY KEY,
  entity_id INTEGER NOT NULL,
  entity_type entity_type NOT NULL,
  role raci_role NOT NULL,
  user_id INTEGER NOT NULL,
  UNIQUE (entity_id, entity_type, role, user_id)
);

-- Tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  experiment_id INTEGER NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee INTEGER,
  due_date DATE,
  status task_status NOT NULL DEFAULT 'Backlog'
);

-- Analysis table (polymorphic relationship to outcomes or experiments)
CREATE TABLE analysis (
  id SERIAL PRIMARY KEY,
  entity_id INTEGER NOT NULL,
  entity_type entity_type NOT NULL,
  current_state JSONB,
  process_breakdown JSONB,
  solutions JSONB,
  UNIQUE (entity_id, entity_type)
);

-- Audit logs table
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  user_id INTEGER,
  entity_id INTEGER,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Outcomes indexes
CREATE INDEX idx_outcomes_status ON outcomes(status);
CREATE INDEX idx_outcomes_level ON outcomes(level);
CREATE INDEX idx_outcomes_parent ON outcomes(parent_outcome_id);
CREATE INDEX idx_outcomes_created_at ON outcomes(created_at DESC);

-- Experiments indexes
CREATE INDEX idx_experiments_outcome ON experiments(outcome_id);
CREATE INDEX idx_experiments_status ON experiments(status);
CREATE INDEX idx_experiments_created_at ON experiments(created_at DESC);

-- RACI indexes
CREATE INDEX idx_raci_entity ON raci(entity_id, entity_type);
CREATE INDEX idx_raci_user ON raci(user_id);
CREATE INDEX idx_raci_role ON raci(role);

-- Tasks indexes
CREATE INDEX idx_tasks_experiment ON tasks(experiment_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Analysis indexes
CREATE INDEX idx_analysis_entity ON analysis(entity_id, entity_type);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_id);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for outcomes
CREATE TRIGGER outcomes_updated_at
  BEFORE UPDATE ON outcomes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for experiments
CREATE TRIGGER experiments_updated_at
  BEFORE UPDATE ON experiments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE raci ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Permissive policies (allow all for now since no auth yet)
-- These should be replaced with proper auth-based policies when authentication is implemented

-- Outcomes policies
CREATE POLICY "Allow all access to outcomes"
  ON outcomes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Experiments policies
CREATE POLICY "Allow all access to experiments"
  ON experiments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RACI policies
CREATE POLICY "Allow all access to raci"
  ON raci
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Tasks policies
CREATE POLICY "Allow all access to tasks"
  ON tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Analysis policies
CREATE POLICY "Allow all access to analysis"
  ON analysis
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Audit logs policies
CREATE POLICY "Allow all access to audit_logs"
  ON audit_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE outcomes IS 'Strategic outcomes that the organization is tracking';
COMMENT ON TABLE experiments IS 'Experiments linked to outcomes to test hypotheses';
COMMENT ON TABLE raci IS 'RACI matrix assignments for outcomes and experiments';
COMMENT ON TABLE tasks IS 'Actionable tasks within experiments';
COMMENT ON TABLE analysis IS 'Analysis data for outcomes and experiments';
COMMENT ON TABLE audit_logs IS 'Audit trail for all entity changes';

COMMENT ON COLUMN outcomes.cascade_alignment IS 'Array of Playing to Win cascade elements this outcome aligns with';
COMMENT ON COLUMN outcomes.metrics IS 'JSON object containing metric definitions and values';
COMMENT ON COLUMN outcomes.parent_outcome_id IS 'Self-referential FK for outcome hierarchy (Org -> Departmental)';

COMMENT ON COLUMN experiments.inputs IS 'JSON object containing experiment input parameters';
COMMENT ON COLUMN experiments.scope IS 'JSON object defining experiment scope and boundaries';
COMMENT ON COLUMN experiments.spec IS 'Detailed specification text for the experiment';

COMMENT ON COLUMN raci.entity_type IS 'Polymorphic type: Outcome or Experiment';
COMMENT ON COLUMN analysis.entity_type IS 'Polymorphic type: Outcome or Experiment';
