// Update the Makhārij chapter content with the image-embedded version.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/updateMakhaarijLesson.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CHAPTER_ID = '535bf175-a662-4181-8332-4e0b560a264d';
const LESSON_HTML = fs.readFileSync('scripts/data/makhaarij_lesson.html', 'utf8');

const { error } = await supabase
  .from('lesson_chapters')
  .update({ content: LESSON_HTML, updated_at: new Date().toISOString() })
  .eq('id', CHAPTER_ID);

if (error) {
  console.error('Update failed:', error);
  process.exit(1);
}

console.log(`✓ Updated chapter ${CHAPTER_ID} (${LESSON_HTML.length} chars)`);
