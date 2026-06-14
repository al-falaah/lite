// Update the Ṣifāt (Part 2) chapter content with the latest version.
//
// Usage:
//   node scripts/updateSifaatStrengthLesson.js

import fs from 'fs';
import { adminClient } from './_lib/supabase.js';

const supabase = adminClient();

const CHAPTER_ID = 'f40827a4-50cd-4278-a380-a34c3762d463';
const LESSON_HTML = fs.readFileSync('scripts/data/sifaat_strength_lesson.html', 'utf8');

const { error } = await supabase
  .from('lesson_chapters')
  .update({ content: LESSON_HTML, updated_at: new Date().toISOString() })
  .eq('id', CHAPTER_ID);

if (error) {
  console.error('Update failed:', error);
  process.exit(1);
}

console.log(`✓ Updated chapter ${CHAPTER_ID} (${LESSON_HTML.length} chars)`);
