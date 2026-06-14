// Update the Makhārij chapter content with the image-embedded version.
//
// Usage:
//   node scripts/updateMakhaarijLesson.js

import fs from 'fs';
import { adminClient } from './_lib/supabase.js';

const supabase = adminClient();

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
