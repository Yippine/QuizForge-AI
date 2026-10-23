-- ============================================================
-- QuizForge-AI v2 · Migration 003
-- 修正 dedup index 漏掉 source_type 導致跨類型題目被誤判重複
--
-- 問題：migration 002 的 dedup key 不含 source_type，
--       使得 sample/exercise/ai 題號相同時只保留第一筆，
--       其餘全部被 client-side filter 視為重複跳過。
-- 解法：重建 idx_questions_dedup，加入 source_type 欄位。
-- ============================================================

-- Step 1: 移除舊 index
DROP INDEX IF EXISTS idx_questions_dedup;

-- Step 2: 重建含 source_type 的 expression unique index
CREATE UNIQUE INDEX idx_questions_dedup
  ON public.questions (
    cert_id,
    subject_id,
    source_type,
    COALESCE(source_year::text, '0'),
    COALESCE(source_batch, ''),
    question_no
  );

-- 說明：
-- source_type 區分 sample / exercise / ai / past，
-- 同一題號在不同類型下是不同的題目，不應互相去重。
-- COALESCE(source_year::text, '0')  → NULL year 統一視為 '0'
-- COALESCE(source_batch, '')        → NULL batch 統一視為空字串
