// Update the Refining Shared Letters chapter content + replace its quiz
// questions with the corrected (source-faithful) versions.
//
// Usage:
//   node scripts/updateSharingLettersChapter.js

import fs from 'fs';
import { adminClient } from './_lib/supabase.js';

const supabase = adminClient();

const CHAPTER_ID = '6a485e15-76a3-45b6-900d-b6ec7b46209d';
const QUIZ_ID    = 'd4aeb6a7-d508-49df-8665-ff99de3c7047';

const LESSON_HTML = fs.readFileSync('scripts/data/sharing_letters_lesson.html', 'utf8');
const QUIZ_QUESTIONS = JSON.parse(fs.readFileSync('scripts/data/sharing_letters_quiz.json', 'utf8'));

console.log(`Step 1: update chapter ${CHAPTER_ID}`);
const { error: chErr } = await supabase
  .from('lesson_chapters')
  .update({ content: LESSON_HTML, updated_at: new Date().toISOString() })
  .eq('id', CHAPTER_ID);
if (chErr) { console.error('Chapter update failed:', chErr); process.exit(1); }
console.log(`  ✓ updated chapter (${LESSON_HTML.length} chars)`);

console.log(`Step 2: delete existing questions for quiz ${QUIZ_ID}`);
const { error: delErr, count: delCount } = await supabase
  .from('quiz_questions')
  .delete({ count: 'exact' })
  .eq('quiz_id', QUIZ_ID);
if (delErr) { console.error('Delete failed:', delErr); process.exit(1); }
console.log(`  ✓ deleted ${delCount ?? '?'} old question(s)`);

console.log(`Step 3: insert ${QUIZ_QUESTIONS.length} new questions`);
const rows = QUIZ_QUESTIONS.map(q => ({
  quiz_id: QUIZ_ID,
  question_number: q.question_number,
  question: q.question,
  options: q.options,
  correct_answer: q.correct_answer,
  explanation: q.explanation,
  difficulty: q.difficulty,
  section_tag: q.section_tag,
}));
const { error: insErr } = await supabase.from('quiz_questions').insert(rows);
if (insErr) { console.error('Insert failed:', insErr); process.exit(1); }
console.log(`  ✓ inserted ${rows.length} new question(s)`);

const passing = Math.round(QUIZ_QUESTIONS.length * 0.7);
console.log(`Step 4: set passing_score to ${passing} (70% of ${QUIZ_QUESTIONS.length})`);
const { error: qErr } = await supabase
  .from('lesson_quizzes')
  .update({ passing_score: passing, updated_at: new Date().toISOString() })
  .eq('id', QUIZ_ID);
if (qErr) { console.error('Quiz update failed:', qErr); process.exit(1); }
console.log(`  ✓ passing_score = ${passing}`);

console.log('\nDone.');
