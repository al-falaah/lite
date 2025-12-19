import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('Checking blog_posts table schema...\n');
  
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (posts && posts.length > 0) {
    console.log('Columns in blog_posts table:');
    Object.keys(posts[0]).forEach(col => {
      console.log(`  - ${col}`);
    });
  } else {
    console.log('No posts found to check schema');
  }
}

checkSchema();
