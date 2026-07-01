// Update only the Refining Shared Letters chapter content (no quiz changes).
//
// Usage:
//   node scripts/updateSharingLettersLesson.js

import fs from 'fs';
import { adminClient } from './_lib/supabase.js';

const supabase = adminClient();

const CHAPTER_ID = '6a485e15-76a3-45b6-900d-b6ec7b46209d';
const LESSON_HTML = fs.readFileSync('scripts/data/sharing_letters_lesson.html', 'utf8');

const { error } = await supabase
  .from('lesson_chapters')
  .update({ content: LESSON_HTML, updated_at: new Date().toISOString() })
  .eq('id', CHAPTER_ID);

if (error) {
  console.error('Update failed:', error);
  process.exit(1);
}

console.log(`✓ Updated chapter ${CHAPTER_ID} (${LESSON_HTML.length} chars)`);
