-- ============================================================
-- QuizForge-AI v2 · Migration 004
-- 修正 source_type CHECK constraint 與前端驗證不一致的問題
--
-- 問題：001_initial_schema.sql 的 CHECK 只允許 'official','sample','ai'
--       但 useXLSXParser.js 驗證允許 'sample','exercise','ai','past'
--       導致 exercise / past 類型的題目匯入時被 DB 拒絕（400 錯誤）
-- 解法：移除舊 constraint，重建為與前端一致的四個值。
--       'official' 廢棄（舊命名，由 'sample' 取代）。
-- ============================================================

ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_source_type_check;

ALTER TABLE public.questions
  ADD CONSTRAINT questions_source_type_check
  CHECK (source_type IN ('sample', 'exercise', 'ai', 'past'));
