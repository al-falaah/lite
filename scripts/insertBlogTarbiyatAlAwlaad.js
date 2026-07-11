// Insert the "How to Raise Righteous Children" blog post as a DRAFT (not published).
//
// Usage:
//   node scripts/insertBlogTarbiyatAlAwlaad.js

import fs from 'fs';
import { adminClient } from './_lib/supabase.js';

const supabase = adminClient();

const AUTHOR_ID = '2cafbb3d-08a4-4976-b417-0597bc19b57d'; // matches existing posts

const CONTENT = fs.readFileSync(
  'scripts/data/blog_tarbiyat_al_awlaad.html',
  'utf8'
);

const POST = {
  title: 'How to Raise Righteous Children — Five Great Means',
  slug: 'how-to-raise-righteous-children',
  excerpt:
    "Dr. ʿAbd al-ʿAzīz al-Rays on the five greatest means for raising children upon the manners of Islam: duʿāʾ, being free of ʿujb, being a good example, avoiding the ḥarām, and choosing good company.",
  content: CONTENT,
  author_name: 'Dr. ʿAbd al-ʿAzīz ibn Rays al-Rays',
  author_id: AUTHOR_ID,
  author_bio: 'Making Islamic Education accessible to everyone.',
  status: 'draft',
  category: 'Akhlaq & Adab',
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
