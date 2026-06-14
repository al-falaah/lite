// Replace the Ṣifāt quiz questions with the latest version (drop + insert) and
// bump passing_score to match the new question count.
//
// Usage:
//   node scripts/updateSifaatQuiz.js

import fs from 'fs';
import { adminClient } from './_lib/supabase.js';

const supabase = adminClient();

const QUIZ_ID = '59051058-d117-453e-8d21-772211a0a8dc';
const QUIZ_QUESTIONS = JSON.parse(fs.readFileSync('scripts/data/sifaat_quiz.json', 'utf8'));

console.log(`Step 1: delete existing questions for quiz ${QUIZ_ID}`);
const { error: delErr, count: delCount } = await supabase
  .from('quiz_questions')
  .delete({ count: 'exact' })
  .eq('quiz_id', QUIZ_ID);
if (delErr) {
  console.error('Delete failed:', delErr);
  process.exit(1);
}
console.log(`  ✓ deleted ${delCount ?? '?'} old question(s)`);

console.log(`Step 2: insert ${QUIZ_QUESTIONS.length} new questions`);
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
if (insErr) {
  console.error('Insert failed:', insErr);
  process.exit(1);
}
console.log(`  ✓ inserted ${rows.length} new question(s)`);

console.log('Step 3: bump passing_score to 14 (70% of 20)');
const { error: qErr } = await supabase
  .from('lesson_quizzes')
  .update({ passing_score: 14, updated_at: new Date().toISOString() })
  .eq('id', QUIZ_ID);
if (qErr) {
  console.error('Quiz update failed:', qErr);
  process.exit(1);
}
console.log('  ✓ passing_score = 14');

console.log('\nDone.');
