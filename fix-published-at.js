// Fix published_at for existing published posts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ Need SUPABASE_SERVICE_ROLE_KEY to update posts');
  console.log('Run this SQL in Supabase Dashboard instead:');
  console.log(`
UPDATE blog_posts
SET published_at = COALESCE(published_at, created_at)
WHERE status = 'published' AND published_at IS NULL;
  `);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixPublishedAt() {
  console.log('Fixing published_at for published posts...\n');

  // Find published posts without published_at
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .is('published_at', null);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log(`Found ${posts?.length || 0} published posts with null published_at`);

  for (const post of posts || []) {
    console.log(`\nFixing: "${post.title}"`);
    console.log(`  Using created_at: ${post.created_at}`);

    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        published_at: post.created_at || new Date().toISOString()
      })
      .eq('id', post.id);

    if (updateError) {
      console.error(`  ❌ Failed:`, updateError.message);
    } else {
      console.log(`  ✓ Fixed`);
    }
  }

  console.log('\n✓ All published posts now have published_at set');
}

fixPublishedAt().catch(console.error);
