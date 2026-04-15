-- Rename the endless grammar deck to "Endless Arabiyyah" (dropping the "Nahw"
-- qualifier since it's meant to cover broader Arabic grammar beyond nahw).
UPDATE drill_decks
SET title = 'Endless Arabiyyah'
WHERE id = '00000000-0000-0000-0000-00000000a4a1';
