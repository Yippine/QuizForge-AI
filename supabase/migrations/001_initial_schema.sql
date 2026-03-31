-- ============================================================
-- QuizForge-AI v2 · Initial Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. profiles ─────────────────────────────────────────────
-- Extends auth.users; auto-created on first sign-in via trigger

CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT,
  display_name TEXT,
  avatar_url   TEXT,
  role         TEXT        NOT NULL DEFAULT 'student'
                           CHECK (role IN ('student', 'admin')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-insert profile on new user sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ── 2. questions ────────────────────────────────────────────
-- Flat table; all structure lives in certifications.json
-- Columns match XLSX import template exactly

CREATE TABLE IF NOT EXISTS public.questions (
  id            BIGSERIAL   PRIMARY KEY,
  cert_id       TEXT        NOT NULL,
  subject_id    TEXT        NOT NULL,
  topic_id      TEXT        NOT NULL,
  topic_name    TEXT,
  source_type   TEXT        NOT NULL
                            CHECK (source_type IN ('official', 'sample', 'ai')),
  source_year   INT,
  source_batch  TEXT,
  question_no   TEXT        NOT NULL,
  question      TEXT        NOT NULL,
  option_a      TEXT        NOT NULL,
  option_b      TEXT        NOT NULL,
  option_c      TEXT        NOT NULL,
  option_d      TEXT        NOT NULL,
  answer        TEXT        NOT NULL CHECK (answer IN ('A', 'B', 'C', 'D')),
  explanation   TEXT,
  has_image     BOOLEAN     NOT NULL DEFAULT FALSE,
  image_note    TEXT,
  difficulty    TEXT        CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),

  -- Dedup key: same question cannot be imported twice
  UNIQUE (cert_id, subject_id, source_year, source_batch, question_no)
);

CREATE INDEX IF NOT EXISTS idx_questions_cert_subject
  ON public.questions (cert_id, subject_id);

CREATE INDEX IF NOT EXISTS idx_questions_topic
  ON public.questions (topic_id);


-- ── 3. user_progress ────────────────────────────────────────
-- One row per answer attempt (not per question)
-- Supports: wrong-question list, analytics, streaks

CREATE TABLE IF NOT EXISTS public.user_progress (
  id              BIGSERIAL   PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id     BIGINT      NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  is_correct      BOOLEAN     NOT NULL,
  selected_answer TEXT,
  answered_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id
  ON public.user_progress (user_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_answered_at
  ON public.user_progress (user_id, answered_at DESC);


-- ── 4. Row Level Security ───────────────────────────────────

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- profiles: 只能讀/改自己的 row；admin 可讀所有
CREATE POLICY "profiles: own read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: own update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- questions: 所有登入用戶可讀
CREATE POLICY "questions: authenticated read"
  ON public.questions FOR SELECT
  TO authenticated
  USING (true);

-- questions: 只有 admin 可以 insert/update/delete
CREATE POLICY "questions: admin write"
  ON public.questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- user_progress: 只能讀/寫自己的 rows
CREATE POLICY "user_progress: own read"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_progress: own insert"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);
