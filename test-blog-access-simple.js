// Simple test to check what blog posts are visible
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('=== Quick Blog Access Test ===\n');

async function testBlogAccess() {
  // Test 1: Get all posts (no filter)
  console.log('1. Fetching ALL posts from blog_posts table...');
  const { data: allPosts, error: allError } = await supabase
    .from('blog_posts')
    .select('*');

  if (allError) {
    console.error('❌ Error:', allError.message);
  } else {
    console.log(`✓ Found ${allPosts?.length || 0} total posts in database`);
    allPosts?.forEach(post => {
      console.log(`   - "${post.title}" (status: ${post.status}, slug: ${post.slug})`);
    });
  }

  // Test 2: Get only published posts (what /blog page should show)
  console.log('\n2. Fetching PUBLISHED posts (what /blog should show)...');
  const { data: publishedPosts, error: publishedError } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (publishedError) {
    console.error('❌ Error:', publishedError.message);
  } else {
    console.log(`✓ Found ${publishedPosts?.length || 0} published posts`);
    if (publishedPosts?.length === 0) {
      console.log('   ⚠️  No published posts! This is why /blog shows "No articles yet"');
      console.log('   Check if posts have status="published" in database');
    } else {
      publishedPosts?.forEach(post => {
        console.log(`   - "${post.title}" (published: ${post.published_at})`);
      });
    }
  }

  // Test 3: Check for draft posts
  console.log('\n3. Checking for DRAFT posts...');
  const { data: draftPosts, error: draftError } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'draft');

  if (!draftError) {
    console.log(`✓ Found ${draftPosts?.length || 0} draft posts`);
    draftPosts?.forEach(post => {
      console.log(`   - "${post.title}"`);
    });
  }
}

testBlogAccess().catch(console.error);
