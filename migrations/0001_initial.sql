-- Action Vault initial schema
-- Every row keyed by user_id (Clerk user id, e.g. "user_2abc...")

CREATE TABLE lists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  course_is_course INTEGER NOT NULL DEFAULT 0,
  course_is_paid INTEGER NOT NULL DEFAULT 0,
  course_price REAL NOT NULL DEFAULT 0,
  course_desc TEXT NOT NULL DEFAULT '',
  course_status TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_lists_user ON lists(user_id);
CREATE INDEX idx_lists_status ON lists(course_status) WHERE course_status IS NOT NULL;

CREATE TABLE list_items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  video_id INTEGER,
  title TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  is_private INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_items_list ON list_items(list_id);
CREATE INDEX idx_items_user ON list_items(user_id);

CREATE TABLE watched (
  user_id TEXT NOT NULL,
  video_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, video_id)
);

CREATE TABLE section_tags (
  user_id TEXT NOT NULL,
  video_id INTEGER NOT NULL,
  section_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, video_id, section_id)
);
CREATE INDEX idx_section_tags_section ON section_tags(section_id);

CREATE TABLE purchases (
  user_id TEXT NOT NULL,
  purchase_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  stripe_session_id TEXT,
  PRIMARY KEY (user_id, purchase_key)
);

CREATE TABLE active_list (
  user_id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL
);
