import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import readline from 'readline';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testAuthenticatedUpdate() {
  try {
    console.log('=== Testing Authenticated Blog Post Update ===\n');

    // Step 1: Check if user is already logged in via GitHub
    console.log('1. Checking current session...');
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      console.log('Already logged in as:', session.user.email);
      console.log('User ID:', session.user.id);
    } else {
      console.log('No active session found.');
      console.log('\nThis test requires you to be logged in via GitHub OAuth.');
      console.log('Please log in through the browser first at /blog/admin');
      console.log('Then run this test again.');
      rl.close();
      return;
    }

    // Step 2: Check if user is admin
    console.log('\n2. Checking admin status...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      rl.close();
      return;
    }

    console.log('Profile found:', profile.full_name);
    console.log('Is admin:', profile.is_admin);

    if (!profile.is_admin) {
      console.error('\n❌ User is not an admin! Cannot proceed with test.');
      rl.close();
      return;
    }

    // Step 3: Get a post to update
    console.log('\n3. Fetching existing blog post...');
    const { data: posts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(1)
      .single();

    if (fetchError) {
      console.error('Error fetching post:', fetchError);
      rl.close();
      return;
    }

    console.log('Found post:', posts.id);
    console.log('Title:', posts.title);
    console.log('Current excerpt:', posts.excerpt?.substring(0, 50) + '...');

    // Step 4: Try to update it (WITH authentication)
    console.log('\n4. Testing UPDATE with authentication...');
    const testExcerpt = `Test update at ${new Date().toISOString()}`;
    console.log('New excerpt:', testExcerpt);

    console.log('\nStarting update request...');
    const startTime = Date.now();

    const updatePromise = supabase
      .from('blog_posts')
      .update({ excerpt: testExcerpt })
      .eq('id', posts.id)
      .select()
      .single();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Update timed out after 15 seconds')), 15000)
    );

    try {
      const { data: updateData, error: updateError } = await Promise.race([
        updatePromise,
        timeoutPromise
      ]);

      const duration = Date.now() - startTime;
      console.log(`Request completed in ${duration}ms`);

      if (updateError) {
        console.error('\n❌ Update failed:');
        console.error('Code:', updateError.code);
        console.error('Message:', updateError.message);
        console.error('Details:', updateError.details);
        console.error('Hint:', updateError.hint);
      } else {
        console.log('\n✅ Update succeeded!');
        console.log('Updated excerpt:', updateData.excerpt);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`\n❌ Request timed out after ${duration}ms`);
      console.error('Error:', error.message);
    }

    // Step 5: Check RLS policies
    console.log('\n5. Current RLS policies on blog_posts:');
    console.log('(Note: pg_policies may not be accessible via anon key)');

  } catch (error) {
    console.error('\nUnexpected error:', error);
  } finally {
    rl.close();
  }
}

testAuthenticatedUpdate();
