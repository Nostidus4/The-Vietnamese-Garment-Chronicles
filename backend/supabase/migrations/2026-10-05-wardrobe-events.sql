-- Tủ áo của Bà (PR #46) sends a new event, wardrobe_wear. Run once in Supabase → SQL Editor on a database
-- created from an older events.sql; without it every wardrobe_wear insert is refused (400) and the event is lost.
alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check check (type in
  ('compass_result', 'look_fixed', 'occasion_selected', 'quiz_answer', 'tryon', 'duky_save', 'wardrobe_wear'));
