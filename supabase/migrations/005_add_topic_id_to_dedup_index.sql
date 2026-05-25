-- ============================================================
-- QuizForge-AI v2 · Migration 005
-- 修正 dedup index 漏掉 topic_id 導致同 subject 跨 topic 的題目被誤判重複
--
-- 問題：migration 003 的 dedup key 不含 topic_id。
--       xlsx 的 question_no 是每個 topic 從 001 重新計數，
--       因此不同 topic 的 question_no='001' 會撞成同一個 key，
--       只有第一筆被寫入，其餘全被 client-side filter 跳過。
--       （exercise 每題 question_no 重複 3 次，ai 重複最多 12 次）
-- 解法：重建 idx_questions_dedup，加入 topic_id 欄位。
-- ============================================================

-- Step 1: 移除舊 index
DROP INDEX IF EXISTS idx_questions_dedup;

-- Step 2: 重建含 topic_id 的 expression unique index
CREATE UNIQUE INDEX idx_questions_dedup
  ON public.questions (
    cert_id,
    subject_id,
    source_type,
    topic_id,
    COALESCE(source_year::text, '0'),
    COALESCE(source_batch, ''),
    question_no
  );

-- 說明：
-- topic_id 區分同一 subject 下的不同章節，
-- question_no 在每個 topic 內獨立計數（從 001 重新開始），
-- 因此唯一性必須落在 topic 層級。
-- COALESCE(source_year::text, '0')  → NULL year 統一視為 '0'
-- COALESCE(source_batch, '')        → NULL batch 統一視為空字串
