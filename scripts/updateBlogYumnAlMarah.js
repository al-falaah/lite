// Update the draft blog post: new title, slug, excerpt, and rewritten prose body.
//
// Usage:
//   node scripts/updateBlogYumnAlMarah.js

import fs from 'fs';
import { adminClient } from './_lib/supabase.js';

const supabase = adminClient();

const POST_ID = 'deda7448-0383-4b42-96f1-9c96c43df3d2';
const CONTENT = fs.readFileSync('scripts/data/blog_yumn_al_marah.html', 'utf8');

const { error } = await supabase
  .from('blog_posts')
  .update({
    title: 'كَيف تَكونُ المَرأةُ بَرَكةً على زَوجِها — How a Woman Becomes a Blessing Upon Her Husband',
    slug: 'how-a-woman-becomes-a-blessing-upon-her-husband',
    excerpt: "On the Prophet's ﷺ words about the three signs of a woman's blessing upon her husband.",
    content: CONTENT,
    updated_at: new Date().toISOString(),
  })
  .eq('id', POST_ID);

if (error) {
  console.error('Update failed:', error);
  process.exit(1);
}

console.log(`✓ Updated draft blog post ${POST_ID}`);
console.log(`  ${CONTENT.length} chars`);
