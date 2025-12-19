// Test Supabase connection and authentication
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('=== Supabase Connection Test ===\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'NOT SET');
  process.exit(1);
}

console.log('✓ Environment variables loaded');
console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey.substring(0, 20) + '...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.error('Error details:', error);
      return false;
    }

    console.log('✓ Basic connection successful\n');

    console.log('2. Testing authentication endpoint...');
    try {
      // Try to sign in with test credentials (expected to fail, but should reach server)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'test@test.com',
        password: 'wrongpassword'
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          console.log('✓ Auth endpoint reachable (credentials invalid as expected)\n');
        } else if (authError.name === 'AuthRetryableFetchError') {
          console.error('❌ Auth endpoint unreachable - Network error');
          console.error('Error:', authError.message);
          console.error('\nThis usually means:');
          console.error('- Supabase project is paused');
          console.error('- Network connectivity issues');
          console.error('- CORS configuration problem');
          console.error('- Invalid Supabase URL');
          return false;
        } else {
          console.log('✓ Auth endpoint reachable\n');
        }
      }
    } catch (err) {
      console.error('❌ Auth test failed:', err.message);
      return false;
    }

    console.log('3. Testing blog_posts table access...');
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(1);

    if (postsError) {
      console.error('❌ blog_posts access failed:', postsError.message);
    } else {
      console.log('✓ blog_posts table accessible');
      console.log('  Found', posts?.length || 0, 'posts\n');
    }

    return true;

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error('Stack:', err.stack);
    return false;
  }
}

testConnection()
  .then(success => {
    if (success) {
      console.log('=== All tests passed ===');
    } else {
      console.log('\n=== Tests failed - Check errors above ===');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
