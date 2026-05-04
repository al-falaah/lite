// One-off: create TMP 201 course + move the Makhārij chapter into it as
// chapter 1 of milestone 2.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/createTMP201AndMoveMakhaarij.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const MAKHAARIJ_CHAPTER_ID = '535bf175-a662-4181-8332-4e0b560a264d';
const TMP_102_AUTHOR = '2cafbb3d-08a4-4976-b417-0597bc19b57d'; // matches existing course rows

async function main() {
  console.log('Step 1: create TMP 201 course');
  const { data: course, error: cErr } = await supabase
    .from('lesson_courses')
    .insert({
      title: 'TMP 201: Articulation and Letter Rules',
      slug: 'tmp-201-articulation-and-letter-rules',
      description:
        "Building on TMP 102, this course teaches the practical mechanics of correct recitation. Students learn the makhārij (articulation points) of every Arabic letter, the characteristics that distinguish them, and the rules governing how letters interact in recitation.",
      program_id: 'tajweed',
      display_order: 1,
      created_by: TMP_102_AUTHOR,
    })
    .select('id')
    .single();
  if (cErr) throw new Error(`course insert: ${cErr.message}`);
  console.log(`  ✓ created course ${course.id}`);

  console.log('Step 2: move Makhārij chapter into TMP 201 (ch 1 / M2 / week 5)');
  const { error: mErr } = await supabase
    .from('lesson_chapters')
    .update({
      course_id: course.id,
      chapter_number: 1,
      milestone_index: 2,
      week_number: 5,
    })
    .eq('id', MAKHAARIJ_CHAPTER_ID);
  if (mErr) throw new Error(`chapter move: ${mErr.message}`);
  console.log('  ✓ moved chapter into TMP 201');

  console.log('\nDone. New course id:', course.id);
}

main().catch((e) => { console.error('FAILED:', e); process.exit(1); });
