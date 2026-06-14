// Insert the "Signs of a Woman's Blessing" blog post as a DRAFT (not published).
//
// Usage:
//   node scripts/insertBlogYumnAlMarah.js

import fs from 'fs';
import { adminClient } from './_lib/supabase.js';

const supabase = adminClient();

const AUTHOR_ID = '2cafbb3d-08a4-4976-b417-0597bc19b57d'; // matches existing posts

const CONTENT = fs.readFileSync('scripts/data/blog_yumn_al_marah.html', 'utf8');

const POST = {
  title: "The Signs of a Woman's Blessing in Marriage",
  slug: 'signs-of-a-womans-blessing-in-marriage',
  excerpt: "On the Prophet's ﷺ words about the three signs of a woman's blessing upon her husband: the ease of her engagement, the ease of her dowry, and the ease of her womb.",
  content: CONTENT,
  author_name: 'The FastTrack Madrasah',
  author_id: AUTHOR_ID,
  author_bio: 'Making Islamic Education accessible to everyone.',
  status: 'draft',
  category: 'Heart Softeners',
};

const { data, error } = await supabase
  .from('blog_posts')
  .insert(POST)
  .select('id, slug, status')
  .single();

if (error) {
  console.error('Insert failed:', error);
  process.exit(1);
}

console.log(`✓ Inserted draft blog post`);
console.log(`  id:     ${data.id}`);
console.log(`  slug:   ${data.slug}`);
console.log(`  status: ${data.status}`);
