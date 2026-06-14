// Update the TMP 102 appendix chapter content with the rewritten v2 HTML.
// Run from project root:
//   node scripts/updateAppendixIstiadhahLesson.js

import fs from 'fs';
import { adminClient } from './_lib/supabase.js';

const supabase = adminClient();

const CHAPTER_ID = 'f768e235-99e0-4206-a99d-8fd6febbb6e0'; // appendix chapter
const LESSON_HTML = fs.readFileSync('scripts/data/appendix_istiadhah_lesson.html', 'utf8');

const { error } = await supabase
  .from('lesson_chapters')
  .update({ content: LESSON_HTML, updated_at: new Date().toISOString() })
  .eq('id', CHAPTER_ID);

if (error) {
  console.error('Update failed:', error);
  process.exit(1);
}

console.log(`✓ Updated chapter ${CHAPTER_ID} with new content (${LESSON_HTML.length} chars)`);
