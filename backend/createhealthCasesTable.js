await db.execute(`
CREATE TABLE healthCases (
  id INTEGER PRIMARY KEY,
  sheepId INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  createdDate TEXT DEFAULT CURRENT_DATE,
  resolvedDate TEXT
)
`);