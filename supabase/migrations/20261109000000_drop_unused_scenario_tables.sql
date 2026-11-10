-- 移除 Part 3 早期設計留下、已無資料也無程式使用的三張表
-- 依外鍵順序由子表往上刪；RLS policy、index、trigger 會隨表一起移除
drop table if exists public.scenario_responses;
drop table if exists public.scenario_questions;
drop table if exists public.scenario_videos;
