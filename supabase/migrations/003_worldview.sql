-- ============================================================
-- sanemos.ai — Add worldview/belief filter to resources
-- ============================================================

-- Add worldview column to resources
ALTER TABLE resources ADD COLUMN worldview TEXT DEFAULT 'universal'
    CHECK (worldview IN ('secular','spiritual','christian','jewish','muslim','buddhist','hindu','universal'));
