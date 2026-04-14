-- Seed a synthetic "Endless Tajweed" deck so that endless-mode attempts
-- have a valid deck_id to record against. Not published, so it never
-- appears in the regular decks list — only reached via /drills/play/<this id>.

INSERT INTO drill_decks (id, title, description, program, topic, cover_emoji, is_published)
VALUES (
  '00000000-0000-0000-0000-00000000e4d1', -- stable UUID — referenced by client
  'Endless Tajweed',
  'Unlimited mixed questions auto-generated from scholar-annotated Qur''an data.',
  'tajweed',
  'Endless',
  '♾️',
  false
)
ON CONFLICT (id) DO NOTHING;
