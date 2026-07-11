import fs from 'fs';
import { adminClient } from './_lib/supabase.js';

const CHAPTER_ID = '76ff5bf9-af2f-4beb-9c60-93956c3b058e';

const QUIZ_QUESTIONS = JSON.parse(
  fs.readFileSync('scripts/data/meem_saakinah_quiz.json', 'utf8')
);

const NEW_QUIZ = {
  chapter_id: CHAPTER_ID,
  title: 'Quiz: Tajweed Rules of Mīm Sākinah',
  subtitle:
    'The three rules of the sākin mīm — ikhfāʾ shafawī, idghām mithlayn ṣaghīr, and iẓhār shafawī — with their trigger letters, examples, and common mistakes.',
  passing_score: 11,
  shuffle_questions: true,
  shuffle_options: true,
  is_published: true,
  published_at: new Date().toISOString(),
};

async function main() {
  const supabase = adminClient();

  console.log('Step 1: insert lesson_quiz row');
  const { data: qz, error: qzErr } = await supabase
    .from('lesson_quizzes')
    .insert(NEW_QUIZ)
    .select('id')
    .single();
  if (qzErr) throw new Error(`quiz insert: ${qzErr.message}`);
  console.log(`  ✓ inserted quiz ${qz.id}`);

  console.log(`Step 2: insert ${QUIZ_QUESTIONS.length} quiz_questions`);
  const rows = QUIZ_QUESTIONS.map((q) => ({
    quiz_id: qz.id,
    question_number: q.question_number,
    question: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    section_tag: q.section_tag,
  }));
  const { error: qsErr } = await supabase.from('quiz_questions').insert(rows);
  if (qsErr) throw new Error(`quiz_questions insert: ${qsErr.message}`);
  console.log(`  ✓ inserted ${rows.length} questions`);

  console.log('\nDone. Quiz id:', qz.id);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
