#!/usr/bin/env node
/**
 * Supabase Connection Diagnostic Tool
 * Run: node diagnose-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Connection Diagnostic\n');

// Check environment variables
console.log('1️⃣ Checking environment variables...');
if (!supabaseUrl) {
  console.log('❌ VITE_SUPABASE_URL is missing');
  process.exit(1);
}
if (!supabaseAnonKey) {
  console.log('❌ VITE_SUPABASE_ANON_KEY is missing');
  process.exit(1);
}
console.log('✅ Environment variables found');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...`);

// Test connection
console.log('\n2️⃣ Testing Supabase connection...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test 1: Simple count query
    console.log('\n   Test 1: Counting lesson_courses...');
    const { count, error: countError } = await supabase
      .from('lesson_courses')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`   ❌ Failed: ${countError.message}`);
      return false;
    }
    console.log(`   ✅ Success: Found ${count} courses`);

    // Test 2: Fetch data
    console.log('\n   Test 2: Fetching lesson_courses data...');
    const { data, error: fetchError } = await supabase
      .from('lesson_courses')
      .select('*')
      .limit(5);

    if (fetchError) {
      console.log(`   ❌ Failed: ${fetchError.message}`);
      return false;
    }
    console.log(`   ✅ Success: Retrieved ${data.length} courses`);
    if (data.length > 0) {
      console.log('\n   Sample course:');
      console.log(`   - Title: ${data[0].title}`);
      console.log(`   - Program: ${data[0].program_id}`);
      console.log(`   - Slug: ${data[0].slug}`);
    }

    // Test 3: Chapters query
    console.log('\n   Test 3: Fetching lesson_chapters data...');
    const { data: chapters, error: chaptersError } = await supabase
      .from('lesson_chapters')
      .select('*')
      .limit(5);

    if (chaptersError) {
      console.log(`   ❌ Failed: ${chaptersError.message}`);
      return false;
    }
    console.log(`   ✅ Success: Retrieved ${chapters.length} chapters`);

    // Test 4: Connection speed
    console.log('\n   Test 4: Measuring connection speed...');
    const startTime = Date.now();
    await supabase.from('lesson_courses').select('count', { count: 'exact', head: true });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`   ⏱️  Response time: ${responseTime}ms`);
    if (responseTime > 5000) {
      console.log('   ⚠️  WARNING: Slow connection detected (>5 seconds)');
    } else if (responseTime > 2000) {
      console.log('   ⚠️  Connection is slower than ideal (>2 seconds)');
    } else {
      console.log('   ✅ Connection speed is good');
    }

    return true;
  } catch (error) {
    console.log(`\n❌ Unexpected error: ${error.message}`);
    console.error(error);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n\n✅ All tests passed! Supabase connection is working properly.\n');
  } else {
    console.log('\n\n❌ Some tests failed. Check the errors above.\n');
    console.log('Possible solutions:');
    console.log('1. Check your internet connection');
    console.log('2. Verify Supabase project is not paused');
    console.log('3. Check RLS policies allow public read access');
    console.log('4. Verify tables exist in your database\n');
  }
  process.exit(success ? 0 : 1);
});
