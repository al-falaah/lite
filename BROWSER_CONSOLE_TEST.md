# Browser Console Test for RLS

Since you're logged in via GitHub OAuth, run this test directly in the browser console:

## Steps:

1. **Open `/blog/admin` in incognito mode and log in**
2. **Open browser DevTools** (F12 or Right-click → Inspect)
3. **Go to Console tab**
4. **Copy and paste this code:**

```javascript
// Test RLS policies while logged in
(async () => {
  console.log('=== Testing Blog RLS Policies ===\n');

  // Get supabase instance from the page
  const { supabase } = await import('/src/services/supabase.js');

  // Test 1: Check current user
  console.log('1. Checking current user...');
  const { data: { user } } = await supabase.auth.getUser();
  console.log('User ID:', user?.id);
  console.log('Email:', user?.email);

  // Test 2: Check profile
  console.log('\n2. Checking profile...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('❌ Profile error:', profileError);
  } else {
    console.log('✓ Profile loaded');
    console.log('  is_admin:', profile.is_admin);
    console.log('  role:', profile.role);
  }

  // Test 3: Try to INSERT a test post
  console.log('\n3. Testing INSERT...');
  const testSlug = 'test-' + Date.now();
  const { data: insertData, error: insertError } = await supabase
    .from('blog_posts')
    .insert([{
      title: 'Test Post',
      slug: testSlug,
      content: '<p>Test content</p>',
      author_name: 'Test',
      status: 'draft'
    }])
    .select()
    .single();

  if (insertError) {
    console.error('❌ INSERT FAILED');
    console.error('Error:', insertError.message);
    console.error('Code:', insertError.code);
    console.error('Details:', insertError.details);
    console.error('Hint:', insertError.hint);
  } else {
    console.log('✓ INSERT successful');
    console.log('Post ID:', insertData.id);

    // Test 4: Try to UPDATE
    console.log('\n4. Testing UPDATE...');
    const { data: updateData, error: updateError } = await supabase
      .from('blog_posts')
      .update({ excerpt: 'Updated' })
      .eq('id', insertData.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ UPDATE FAILED');
      console.error('Error:', updateError.message);
      console.error('Code:', updateError.code);
    } else {
      console.log('✓ UPDATE successful');
    }

    // Test 5: Clean up - DELETE test post
    console.log('\n5. Cleaning up...');
    const { error: deleteError } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.error('❌ DELETE failed:', deleteError.message);
    } else {
      console.log('✓ Test post deleted');
    }
  }

  console.log('\n=== Test Complete ===');
})();
```

5. **Press Enter** and check the output

## What to Look For:

### If you see:
```
❌ INSERT FAILED
Error: new row violates row-level security policy
```
**→ The RLS policies are blocking admin access**

### If you see:
```
✓ INSERT successful
✓ UPDATE successful
```
**→ RLS policies are working! The issue is in the BlogAdmin component**

### If profile shows:
```
is_admin: false
```
**→ Your profile isn't marked as admin**

Run this and share the console output with me.
