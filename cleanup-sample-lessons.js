/**
 * Script to clean up sample lesson data from the database
 * WARNING: This will delete data permanently!
 * Run with: node cleanup-sample-lessons.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin operations
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function cleanupSampleLessons() {
  console.log('⚠️  SAMPLE LESSON CLEANUP TOOL\n');
  console.log('This tool will help you identify and remove sample/test lesson data.\n');

  try {
    // Fetch all courses
    const { data: courses, error: coursesError } = await supabase
      .from('lesson_courses')
      .select('*, lesson_chapters(count)')
      .order('created_at');

    if (coursesError) throw coursesError;

    if (courses.length === 0) {
      console.log('✅ No courses found in the database.');
      rl.close();
      return;
    }

    console.log(`Found ${courses.length} course(s):\n`);

    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      console.log(`${i + 1}. ${course.title}`);
      console.log(`   Slug: ${course.slug}`);
      console.log(`   Program: ${course.program_id}`);
      console.log(`   Chapters: ${course.lesson_chapters[0]?.count || 0}`);
      console.log(`   Created: ${new Date(course.created_at).toLocaleString()}\n`);
    }

    const answer = await askQuestion('Enter course number to inspect (or "q" to quit): ');

    if (answer.toLowerCase() === 'q') {
      console.log('Exiting...');
      rl.close();
      return;
    }

    const courseIndex = parseInt(answer) - 1;
    if (courseIndex < 0 || courseIndex >= courses.length) {
      console.log('❌ Invalid course number');
      rl.close();
      return;
    }

    const selectedCourse = courses[courseIndex];

    // Fetch chapters
    const { data: chapters, error: chaptersError } = await supabase
      .from('lesson_chapters')
      .select('*')
      .eq('course_id', selectedCourse.id)
      .order('chapter_number');

    if (chaptersError) throw chaptersError;

    console.log(`\n📚 Course: ${selectedCourse.title}`);
    console.log(`\nChapters (${chapters.length}):\n`);

    for (const chapter of chapters) {
      console.log(`\n${chapter.chapter_number}. ${chapter.title}`);
      console.log(`   Published: ${chapter.is_published ? '✅ Yes' : '❌ No'}`);
      console.log(`   Content preview:`);
      console.log(`   ${chapter.content.substring(0, 150).replace(/\n/g, ' ')}...\n`);
    }

    const deleteAnswer = await askQuestion('\n⚠️  Delete this entire course and all chapters? (yes/no): ');

    if (deleteAnswer.toLowerCase() === 'yes') {
      console.log('\n🗑️  Deleting course...');
      
      const { error: deleteError } = await supabase
        .from('lesson_courses')
        .delete()
        .eq('id', selectedCourse.id);

      if (deleteError) throw deleteError;

      console.log('✅ Course and all chapters deleted successfully!');
    } else {
      console.log('❌ Deletion cancelled.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

cleanupSampleLessons();
