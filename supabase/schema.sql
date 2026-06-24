-- Run this in your Supabase SQL editor

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part        TEXT NOT NULL CHECK (part IN ('viet','anh','toan','khoa_hoc')),
  module      TEXT NOT NULL,
  content     TEXT NOT NULL,
  option_a    TEXT NOT NULL,
  option_b    TEXT NOT NULL,
  option_c    TEXT NOT NULL,
  option_d    TEXT NOT NULL,
  answer      TEXT NOT NULL CHECK (answer IN ('A','B','C','D')),
  explanation TEXT,
  difficulty  TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  source      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  year        INT,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Test questions join table
CREATE TABLE IF NOT EXISTS test_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id     UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_num   INT NOT NULL,
  UNIQUE(test_id, question_id)
);

-- RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;

-- Admins can do everything; students/public can read
CREATE POLICY "admins_all_questions" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "public_read_questions" ON questions
  FOR SELECT USING (true);

CREATE POLICY "admins_all_tests" ON tests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "public_read_tests" ON tests
  FOR SELECT USING (true);

CREATE POLICY "admins_all_test_questions" ON test_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "public_read_test_questions" ON test_questions
  FOR SELECT USING (true);

-- Add passage column (run this if tables already exist)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS passage TEXT;

-- Add image description column
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_description TEXT;

-- Image URL for questions with figures
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Storage bucket (run in Supabase dashboard > Storage, or via SQL):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('question-images', 'question-images', true);
-- CREATE POLICY "Public read question images" ON storage.objects FOR SELECT USING (bucket_id = 'question-images');
-- CREATE POLICY "Admins upload question images" ON storage.objects FOR INSERT WITH CHECK (
--   bucket_id = 'question-images' AND
--   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
-- );
