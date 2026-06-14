// Replace the Ṣifāt (Part 2) quiz questions with the latest version (drop +
// insert) and adjust passing_score to match the new question count.
//
// Usage:
//   node scripts/updateSifaatStrengthQuiz.js

import fs from 'fs';
import { adminClient } from './_lib/supabase.js';

const supabase = adminClient();

const QUIZ_ID = 'f38d2089-701b-4dd9-8720-a0afdafc8ece';
const QUIZ_QUESTIONS = JSON.parse(fs.readFileSync('scripts/data/sifaat_strength_quiz.json', 'utf8'));

console.log(`Step 1: delete existing questions for quiz ${QUIZ_ID}`);
const { error: delErr, count: delCount } = await supabase
  .from('quiz_questions')
  .delete({ count: 'exact' })
  .eq('quiz_id', QUIZ_ID);
if (delErr) { console.error('Delete failed:', delErr); process.exit(1); }
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
if (insErr) { console.error('Insert failed:', insErr); process.exit(1); }
console.log(`  ✓ inserted ${rows.length} new question(s)`);

const passing = Math.round(QUIZ_QUESTIONS.length * 0.7);
console.log(`Step 3: set passing_score to ${passing} (70% of ${QUIZ_QUESTIONS.length})`);
const { error: qErr } = await supabase
  .from('lesson_quizzes')
  .update({ passing_score: passing, updated_at: new Date().toISOString() })
  .eq('id', QUIZ_ID);
if (qErr) { console.error('Quiz update failed:', qErr); process.exit(1); }
console.log(`  ✓ passing_score = ${passing}`);

console.log('\nDone.');
