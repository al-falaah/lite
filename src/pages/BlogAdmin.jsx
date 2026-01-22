import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';
import { Save, Eye, Trash2, Edit2, Home } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';

const CATEGORIES = [
  'General',
  'Quran & Tafsir',
  'Hadith & Sunnah',
  'Aqeedah',
  'Fiqh',
  'Arabic Language',
  'Seerah',
  'Akhlaq & Adab',
  'Heart Softeners',
  'Ramadan & Seasons'
];

const BlogAdmin = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signIn, signOut } = useAuth();

  // Determine back link based on user role
  const backLink = profile?.role === 'director' ? '/director' : '/admin';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    author_name: 'Dr Abdulquadri Alaka',
    author_bio: "Allah's servant who is most in need of His help.",
    category: 'General',
    status: 'draft',
    is_pinned: false
  });

  useEffect(() => {
    fetchAllPosts();
  }, []);

  const fetchAllPosts = async () => {
    console.log('[BlogAdmin] Fetching all posts using direct API...');
    setLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Get auth token from localStorage to fetch both drafts and published posts
      const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
      const authData = localStorage.getItem(storageKey);

      const headers = {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      };

      // Add Authorization header if we have an access token (to see draft posts)
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          const accessToken = parsed.access_token || parsed.accessToken;
          if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
            console.log('[BlogAdmin] Added auth header to fetch drafts');
          }
        } catch (e) {
          console.warn('[BlogAdmin] Could not parse auth data:', e);
        }
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/blog_posts?order=created_at.desc&select=*`, {
        headers
      });

      console.log('[BlogAdmin] Fetch response:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[BlogAdmin] Posts fetched:', data?.length || 0, 'posts');

      setPosts(data || []);
    } catch (error) {
      console.error('[BlogAdmin] Error fetching posts:', error);
      toast.error(`Failed to load posts: ${error.message || 'Unknown error'}`);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title)
    });
  };

  const handleSave = async (publishNow = false) => {
    console.log('handleSave called with publishNow:', publishNow);
    console.log('Current formData:', formData);
    console.log('Editing post:', editingPost?.id);

    // Check authentication status before attempting save
    // IMPORTANT: We skip getSession() because it hangs. Instead, use user from context.
    console.log('[Auth Check] Using user from context:', user?.id);

    if (!user) {
      console.error('[Auth Check] No user in context! Please log in.');
      toast.error('Not logged in. Please refresh the page and log in again.');
      return;
    }

    console.log('[Auth Check] User email:', user.email);
    console.log('[Auth Check] Profile is_admin:', profile?.is_admin);

    if (!formData.title || !formData.content) {
      toast.error('Title and content are required');
      return;
    }

    try {
      // Determine the new status
      const newStatus = publishNow ? 'published' : (formData.status || 'draft');

      // Determine published_at
      let publishedAt = formData.published_at;

      // If we're publishing and there's no published_at yet, set it now
      if (publishNow && !publishedAt) {
        publishedAt = new Date().toISOString();
      }

      // If we're switching from published to draft, clear published_at
      if (!publishNow && formData.status === 'published') {
        publishedAt = null;
      }

      const postData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt || null,
        content: formData.content,
        featured_image: formData.featured_image || null,
        author_name: formData.author_name || 'Admin',
        author_bio: formData.author_bio || null,
        category: formData.category || 'General',
        author_id: user.id, // CRITICAL: Set author_id to current user
        status: newStatus,
        published_at: publishedAt,
        is_pinned: formData.is_pinned || false
      };

      console.log('Attempting to save post:', postData);

      // Skip session refresh - it hangs due to Supabase Auth API timeout.
      // The Supabase client should automatically use auth from localStorage.
      console.log('[Database] Proceeding directly to database operation...');

      let result;
      if (editingPost) {
        console.log('Updating existing post:', editingPost.id);
        console.log('Update data:', postData);

        // Add timeout to prevent hanging
        console.log('[DB] BYPASSING SUPABASE CLIENT - Using direct fetch...');

        // Get auth token from localStorage
        const storageKey = `sb-${import.meta.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`;
        const authData = localStorage.getItem(storageKey);
        console.log('[DB] Looking for auth in localStorage key:', storageKey);
        console.log('[DB] Auth data found:', authData ? 'Yes' : 'No');

        let accessToken = null;
        if (authData) {
          try {
            const parsed = JSON.parse(authData);
            accessToken = parsed.access_token || parsed.accessToken;
            console.log('[DB] Access token extracted:', accessToken ? 'Yes' : 'No');
          } catch (e) {
            console.error('[DB] Failed to parse auth data:', e);
          }
        }

        // Direct fetch to Supabase REST API
        const updatePromise = new Promise((resolve, reject) => {
          console.log('[DB] Starting direct fetch request...');

          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const url = `${supabaseUrl}/rest/v1/blog_posts?id=eq.${editingPost.id}`;

          console.log('[DB] Fetch URL:', url);

          const headers = {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Prefer': 'return=representation'
          };

          // Add Authorization header if we have an access token
          if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
            console.log('[DB] Added Authorization header with access token');
          } else {
            console.warn('[DB] No access token found - request may be unauthenticated');
          }

          fetch(url, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(postData)
          })
          .then(async response => {
            console.log('[DB] Fetch response received:', response.status, response.statusText);

            // Parse response body to get error details
            const responseData = await response.json();

            if (!response.ok) {
              console.error('[DB] Error response body:', responseData);
              const error = new Error(`HTTP ${response.status}: ${responseData.message || response.statusText}`);
              error.details = responseData;
              throw error;
            }

            return responseData;
          })
          .then(data => {
            console.log('[DB] Fetch data parsed:', data);
            resolve({ data: Array.isArray(data) ? data : [data], error: null });
          })
          .catch(error => {
            console.error('[DB] Fetch error:', error);
            console.error('[DB] Error details:', error.details);
            reject(error);
          });
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => {
            console.error('[DB] Timeout reached!');
            reject(new Error('Update request timed out after 10 seconds'));
          }, 10000)
        );

        console.log('[DB] About to await Promise.race...');
        const updateResult = await Promise.race([updatePromise, timeoutPromise]);
        console.log('[DB] Promise.race completed!');
        console.log('Update result:', updateResult);

        // Extract single item from array result
        result = {
          data: updateResult.data?.[0] || null,
          error: updateResult.error
        };
      } else {
        console.log('Inserting new post');
        console.log('Insert data:', postData);

        // BYPASS SUPABASE CLIENT - Use direct REST API
        console.log('[DIRECT API] Bypassing Supabase client, using direct REST API...');

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        // Get auth token - check all possible storage locations
        console.log('[DIRECT API] Looking for auth token in storage...');

        let accessToken = null;

        // Try different localStorage keys that Supabase might use
        const possibleKeys = [
          `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`,
          'supabase.auth.token',
          'sb-auth-token'
        ];

        for (const key of possibleKeys) {
          const data = localStorage.getItem(key);
          if (data) {
            console.log('[DIRECT API] Found data in key:', key);
            try {
              const parsed = JSON.parse(data);
              accessToken = parsed.access_token || parsed.accessToken || parsed.currentSession?.access_token;
              if (accessToken) {
                console.log('[DIRECT API] Extracted access token from:', key);
                break;
              }
            } catch (e) {
              console.error('[DIRECT API] Failed to parse data from', key, ':', e);
            }
          }
        }

        // If still no token, just use the apikey (anon key) which should work with RLS disabled
        if (!accessToken) {
          console.log('[DIRECT API] No access token found - using apikey only');
        }

        console.log('[DIRECT API] Auth token:', accessToken ? 'Found' : 'Not found');

        const headers = {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Prefer': 'return=representation'
        };

        // Add auth token if we have one (but should work without it since RLS is disabled)
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
          console.log('[DIRECT API] Added Authorization header');
        } else {
          console.log('[DIRECT API] No auth token - relying on apikey only');
        }

        console.log('[DIRECT API] Making fetch request...');

        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/blog_posts`, {
            method: 'POST',
            headers,
            body: JSON.stringify(postData)
          });

          console.log('[DIRECT API] Response status:', response.status, response.statusText);

          const responseData = await response.json();
          console.log('[DIRECT API] Response data:', responseData);

          if (!response.ok) {
            result = {
              data: null,
              error: {
                message: responseData.message || response.statusText,
                details: responseData,
                code: responseData.code
              }
            };
          } else {
            result = {
              data: Array.isArray(responseData) ? responseData[0] : responseData,
              error: null
            };
          }
        } catch (fetchError) {
          console.error('[DIRECT API] Fetch error:', fetchError);
          throw fetchError;
        }
      }

      if (result.error) {
        console.error('Supabase operation failed:');
        console.error('  Error message:', result.error.message);
        console.error('  Error code:', result.error.code);
        console.error('  Error details:', result.error.details);
        console.error('  Error hint:', result.error.hint);
        throw result.error;
      }

      console.log('Save successful, data:', result.data);

      const successMessage = editingPost
        ? (publishNow ? 'Post updated and republished!' : 'Post updated successfully!')
        : (publishNow ? 'Post published successfully!' : 'Post saved as draft');

      toast.success(successMessage);

      // Reset form immediately, don't wait for fetchAllPosts
      resetForm();

      // Fetch posts in background (don't block on this)
      fetchAllPosts().catch(err => {
        console.error('[handleSave] Failed to refresh posts list:', err);
        // Don't show error to user - they can refresh manually
      });
    } catch (error) {
      console.error('Error saving post:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast.error(`Failed to save post: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      featured_image: post.featured_image || '',
      author_name: post.author_name || '',
      author_bio: post.author_bio || '',
      category: post.category || 'General',
      status: post.status,
      published_at: post.published_at,
      is_pinned: post.is_pinned || false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Post deleted successfully');
      fetchAllPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleToggleStatus = async (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const publishedAt = newStatus === 'published' ? new Date().toISOString() : null;

    try {
      // Get auth token from localStorage
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
      const authData = localStorage.getItem(storageKey);

      let accessToken = null;
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          accessToken = parsed.access_token || parsed.accessToken;
        } catch (e) {
          console.error('Failed to parse auth data:', e);
        }
      }

      const headers = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Prefer': 'return=representation'
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/blog_posts?id=eq.${post.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: newStatus,
          published_at: publishedAt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }

      toast.success(`Post ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      fetchAllPosts();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update post status');
    }
  };

  const resetForm = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
      author_name: 'Dr Abdulquadri Alaka',
      author_bio: "Allah's servant who is most in need of His help.",
      category: 'General',
      status: 'draft',
      is_pinned: false
    });
  };

  const insertFormatting = (before, after = '') => {
    const textarea = document.getElementById('content-editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const newText =
      formData.content.substring(0, start) +
      before +
      selectedText +
      after +
      formData.content.substring(end);

    setFormData({ ...formData, content: newText });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  // Only show loading while auth is checking
  // Don't wait indefinitely for profile if user exists
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-12 w-12 mx-auto mb-4" />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Debug logging for auth state
  console.log('[BlogAdmin] Auth state:', {
    hasUser: !!user,
    userEmail: user?.email,
    hasProfile: !!profile,
    isAdmin: profile?.is_admin,
    profileData: profile
  });

  // Show login/error if not authenticated as admin
  // Wait for profile to load if user exists
  if (!user || (user && !profile) || (user && profile && !profile.is_admin)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity mb-4">
              <img src="/favicon.svg" alt="The FastTrack Madrasah" className="h-10 w-10" />
              <div className="flex flex-col leading-none -space-y-1">
                <span className="text-base sm:text-lg font-bold text-gray-900" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                <span className="text-base sm:text-lg font-bold text-gray-900" style={{letterSpacing: "0.28em"}}>Madrasah</span>
              </div>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900 mt-4">Blog Admin</h2>
            <p className="text-gray-600 mt-2">Sign in to manage blog posts</p>
            {user && profile && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 font-mono">
                  Debug: email={user.email}, is_admin={String(profile.is_admin)}, role={profile.role}
                </p>
              </div>
            )}
          </div>

          {!user ? (
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const email = formData.get('email');
              const password = formData.get('password');

              setLoggingIn(true);
              try {
                await signIn(email, password);
                toast.success('Signed in successfully');
                // Don't set loggingIn to false here - let the component re-render with user
              } catch (error) {
                toast.error('Invalid credentials');
                setLoggingIn(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  disabled={loggingIn}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  disabled={loggingIn}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={loggingIn}>
                {loggingIn ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          ) : user && !profile ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm">Loading profile...</p>
            </div>
          ) : !profile?.is_admin ? (
            <div className="text-center">
              <p className="text-red-600 mb-4">You do not have admin access to the blog.</p>
              <Button onClick={signOut} variant="outline" className="w-full">
                Sign Out
              </Button>
            </div>
          ) : null}

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-emerald-600 hover:text-emerald-700">
              ← Back to Home
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="/favicon.svg"
                alt="The FastTrack Madrasah"
                className="h-8 w-8"
              />
              <div className="flex flex-col leading-none -space-y-1">
                <div className="flex flex-col leading-none -space-y-1">
                  <span className="text-xs sm:text-sm font-semibold text-gray-900" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900" style={{letterSpacing: "0.28em"}}>Madrasah</span>
                </div>
                <span className="text-xs text-gray-500 mt-0.5">Blog Admin</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to={backLink}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link
                to="/blog"
                className="text-sm text-gray-600 hover:text-emerald-600 transition-colors hidden sm:inline"
              >
                View Blog
              </Link>
              <button
                onClick={signOut}
                className="text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create & Manage Posts</h1>
          <p className="text-gray-600">Write and publish articles for The FastTrack Madrasah blog</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Editor Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingPost ? 'Edit Post' : 'New Post'}
              </h2>

              {/* Title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter post title"
                />
              </div>

              {/* Slug */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="post-url-slug"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL: /blog/{formData.slug || 'your-post-slug'}
                </p>
              </div>

              {/* Excerpt */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt (Preview Text)
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Brief description for preview cards"
                />
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the topic area for this article
                </p>
              </div>

              {/* Pin Post Checkbox */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_pinned || false}
                    onChange={async (e) => {
                      const willPin = e.target.checked;

                      // Check if we already have 2 pinned posts
                      if (willPin) {
                        const pinnedCount = posts.filter(p => p.is_pinned && p.id !== editingPost?.id).length;
                        if (pinnedCount >= 2) {
                          toast.error('Maximum 2 posts can be pinned. Please unpin another post first.');
                          return;
                        }
                      }

                      setFormData({ ...formData, is_pinned: willPin });
                    }}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Pin this post at the top of the blog page
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Pinned posts appear at the top of the blog page. Maximum 2 posts can be pinned.
                </p>
              </div>

              {/* Featured Image */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image URL
                </label>
                <input
                  type="text"
                  value={formData.featured_image}
                  onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="https://images.unsplash.com/photo-..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  For Unsplash: Right-click image → "Copy image address" to get direct URL
                </p>
                {formData.featured_image && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                    <img
                      src={formData.featured_image}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'block';
                      }}
                    />
                    <div className="hidden p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      ⚠️ Image failed to load. Please check the URL is correct and publicly accessible.
                    </div>
                  </div>
                )}
              </div>

              {/* Author Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author Name
                </label>
                <input
                  type="text"
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., Ustadh Abdulquadri Alaka"
                />
              </div>

              {/* Author Bio */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author Bio (Optional)
                </label>
                <textarea
                  value={formData.author_bio}
                  onChange={(e) => setFormData({ ...formData, author_bio: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="A brief bio about the author (shown at the bottom of the post)"
                />
              </div>

              {/* Formatting Toolbar */}
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content * (HTML supported)
                </label>
                <div className="flex flex-wrap gap-2 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => insertFormatting('<h2>', '</h2>')}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                    title="Heading 2"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<h3>', '</h3>')}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                    title="Heading 3"
                  >
                    H3
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<p>', '</p>')}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                    title="Paragraph"
                  >
                    P
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<strong>', '</strong>')}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<em>', '</em>')}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 italic"
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<ul>\n  <li>', '</li>\n</ul>')}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                    title="Bullet List"
                  >
                    UL
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<a href="">', '</a>')}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                    title="Link"
                  >
                    Link
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<sup>', '</sup>')}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                    title="Superscript"
                  >
                    X<sup className="text-xs">2</sup>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<sub>', '</sub>')}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                    title="Subscript"
                  >
                    X<sub className="text-xs">2</sub>
                  </button>
                </div>
              </div>

              {/* Content Editor */}
              <textarea
                id="content-editor"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows="20"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
                placeholder="Write your content here. HTML tags are supported."
              />

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  {editingPost && formData.status === 'published' ? 'Update & Republish' : 'Publish'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {editingPost ? 'Update Draft' : 'Save Draft'}
                </button>
                {editingPost && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Posts List Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 sticky top-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">All Posts</h2>

              {loading ? (
                <p className="text-gray-500 text-sm">Loading...</p>
              ) : posts.length === 0 ? (
                <p className="text-gray-500 text-sm">No posts yet</p>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="border border-gray-200 rounded-lg p-3 hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 flex-1">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                              post.status === 'published'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {post.status}
                          </span>
                          <button
                            onClick={() => handleToggleStatus(post)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              post.status === 'published'
                                ? 'bg-emerald-600'
                                : 'bg-gray-300'
                            }`}
                            title={post.status === 'published' ? 'Switch to draft' : 'Publish'}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                post.status === 'published' ? 'translate-x-5' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(post)}
                            className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500" title="Views">
                          <Eye className="h-3 w-3" />
                          <span className="text-xs">{post.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogAdmin;
