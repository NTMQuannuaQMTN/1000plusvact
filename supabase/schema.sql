-- ============================================================
-- VACT — Full schema
-- Run the entire file in Supabase SQL Editor (it is safe to
-- re-run: all statements use IF NOT EXISTS / IF NOT EXISTS).
-- ============================================================

-- Profiles table (created by Supabase Auth trigger)
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  school       TEXT,
  role         TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  target_score INT  NOT NULL DEFAULT 1000,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill any missing columns if table already existed
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS school       TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_score INT NOT NULL DEFAULT 1000;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "admins_all_profiles" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- Questions
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part             TEXT NOT NULL CHECK (part IN ('viet','anh','toan','khoa_hoc')),
  module           TEXT NOT NULL,
  content          TEXT NOT NULL,
  option_a         TEXT NOT NULL,
  option_b         TEXT NOT NULL,
  option_c         TEXT NOT NULL,
  option_d         TEXT NOT NULL,
  answer           TEXT NOT NULL CHECK (answer IN ('A','B','C','D')),
  explanation      TEXT,
  difficulty       TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  source           TEXT,
  passage          TEXT,
  image_description TEXT,
  image_url        TEXT,
  image_group      INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE questions ADD COLUMN IF NOT EXISTS passage           TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_description TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url         TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_group       INT;

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_all_questions" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "public_read_questions" ON questions
  FOR SELECT USING (true);

-- ============================================================
-- Tests
-- ============================================================
CREATE TABLE IF NOT EXISTS tests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  year        INT,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS test_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id     UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_num   INT NOT NULL,
  UNIQUE(test_id, question_id)
);

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;

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

-- ============================================================
-- Test submissions
-- ============================================================
CREATE TABLE IF NOT EXISTS test_submissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id    UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers    JSONB NOT NULL DEFAULT '{}',
  score      INT  NOT NULL DEFAULT 0,
  total      INT  NOT NULL DEFAULT 0,
  breakdown  JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE test_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_submissions" ON test_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_submissions" ON test_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_all_submissions" ON test_submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- Storage bucket for question images
-- Run this block separately if it fails (storage extension may
-- need to be enabled first in Supabase dashboard > Extensions)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_read_question_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'question-images');

CREATE POLICY "admins_upload_question_images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'question-images' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admins_delete_question_images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'question-images' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
