-- ============================================================
-- QuizForge-AI v2 · Migration 002
-- 修正 unique constraint 的 NULL 漏洞
--
-- 問題：PostgreSQL unique constraint 中，NULL != NULL
--       導致 source_year/source_batch 為 NULL 時同一題可重複匯入
-- 解法：Drop 舊 constraint，改用 expression unique index + COALESCE
-- ============================================================

-- Step 1: 移除舊的 inline UNIQUE constraint（若已存在）
ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_cert_id_subject_id_source_year_source_batch_questi_key;

-- Step 2: 建立新的 expression unique index（NULL 安全）
DROP INDEX IF EXISTS idx_questions_dedup;
CREATE UNIQUE INDEX idx_questions_dedup
  ON public.questions (
    cert_id,
    subject_id,
    COALESCE(source_year::text, '0'),
    COALESCE(source_batch, ''),
    question_no
  );

-- 說明：
-- COALESCE(source_year::text, '0')  → NULL year 統一視為 '0'，避免重複匯入
-- COALESCE(source_batch, '')        → NULL batch 統一視為空字串
-- 同一題（相同 cert/subject/year/batch/no）只能存在一筆
