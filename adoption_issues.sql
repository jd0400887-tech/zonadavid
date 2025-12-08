CREATE TABLE adoption_issues (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  employee_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  notes TEXT,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);
