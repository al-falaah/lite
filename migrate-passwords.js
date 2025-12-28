/**
 * One-time migration script to hash existing plain-text passwords
 * Run this ONCE after deploying the bcrypt changes
 *
 * Usage: node migrate-passwords.js
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  console.error('   Add SUPABASE_SERVICE_ROLE_KEY to your .env file (get it from Supabase Dashboard > Settings > API)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function hashExistingPasswords() {
  console.log('🔐 Starting password migration...\n');

  try {
    // Migrate student passwords
    console.log('📚 Fetching students with plain-text passwords...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, student_id, password')
      .not('password', 'is', null);

    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`);
    }

    console.log(`   Found ${students.length} students\n`);

    let studentsUpdated = 0;
    let studentsSkipped = 0;

    for (const student of students) {
      // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
      if (student.password && student.password.startsWith('$2')) {
        console.log(`   ⏭️  Student ${student.student_id || student.id}: Already hashed, skipping`);
        studentsSkipped++;
        continue;
      }

      if (!student.password) {
        console.log(`   ⏭️  Student ${student.student_id || student.id}: No password, skipping`);
        studentsSkipped++;
        continue;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(student.password, 10);

      // Update the student record
      const { error: updateError } = await supabase
        .from('students')
        .update({ password: hashedPassword })
        .eq('id', student.id);

      if (updateError) {
        console.error(`   ❌ Failed to update student ${student.student_id || student.id}: ${updateError.message}`);
      } else {
        console.log(`   ✅ Student ${student.student_id || student.id}: Password hashed`);
        studentsUpdated++;
      }
    }

    console.log(`\n📊 Students: ${studentsUpdated} updated, ${studentsSkipped} skipped\n`);

    // Migrate teacher passwords
    console.log('👨‍🏫 Fetching teachers with plain-text passwords...');
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select('id, staff_id, password')
      .not('password', 'is', null);

    if (teachersError) {
      throw new Error(`Failed to fetch teachers: ${teachersError.message}`);
    }

    console.log(`   Found ${teachers.length} teachers\n`);

    let teachersUpdated = 0;
    let teachersSkipped = 0;

    for (const teacher of teachers) {
      // Check if password is already hashed
      if (teacher.password && teacher.password.startsWith('$2')) {
        console.log(`   ⏭️  Teacher ${teacher.staff_id || teacher.id}: Already hashed, skipping`);
        teachersSkipped++;
        continue;
      }

      if (!teacher.password) {
        console.log(`   ⏭️  Teacher ${teacher.staff_id || teacher.id}: No password, skipping`);
        teachersSkipped++;
        continue;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(teacher.password, 10);

      // Update the teacher record
      const { error: updateError } = await supabase
        .from('teachers')
        .update({ password: hashedPassword })
        .eq('id', teacher.id);

      if (updateError) {
        console.error(`   ❌ Failed to update teacher ${teacher.staff_id || teacher.id}: ${updateError.message}`);
      } else {
        console.log(`   ✅ Teacher ${teacher.staff_id || teacher.id}: Password hashed`);
        teachersUpdated++;
      }
    }

    console.log(`\n📊 Teachers: ${teachersUpdated} updated, ${teachersSkipped} skipped\n`);

    console.log('✨ Password migration completed successfully!');
    console.log(`\n📝 Summary:`);
    console.log(`   Students: ${studentsUpdated} updated, ${studentsSkipped} skipped`);
    console.log(`   Teachers: ${teachersUpdated} updated, ${teachersSkipped} skipped`);
    console.log(`   Total: ${studentsUpdated + teachersUpdated} passwords hashed\n`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
hashExistingPasswords();
