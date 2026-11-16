-- =====================================================
-- 每日商業閱讀：文章改為依真實新聞（RSS 標題與摘要）撰寫解說
-- 記錄來源，方便附上原文連結，並避免同一則新聞重複使用
-- Created: 2026-11-16
-- =====================================================

alter table public.reading_articles
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists source_published_at timestamptz;

-- 舊的純 AI 文章沒有來源，所以欄位可為 null；有來源的連結不可重複
create unique index if not exists uq_reading_articles_source_url
  on public.reading_articles(source_url) where source_url is not null;

create index if not exists idx_reading_articles_category_date
  on public.reading_articles(category, article_date desc);
