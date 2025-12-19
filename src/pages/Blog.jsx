import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar, ArrowRight, Home } from 'lucide-react';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    console.log('[Blog] Fetching published blog posts...');

    try {
      // BYPASS SUPABASE CLIENT - Use direct fetch for better reliability
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const url = `${supabaseUrl}/rest/v1/blog_posts?status=eq.published&order=published_at.desc&select=*`;

      console.log('[Blog] Direct fetch to:', url);

      // Create the fetch promise
      const fetchPromise = fetch(url, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json'
        }
      })
      .then(async response => {
        console.log('[Blog] Response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
        }
        return response.json();
      });

      // Create a timeout promise that rejects after 5 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );

      // Race between fetch and timeout
      const data = await Promise.race([fetchPromise, timeoutPromise]);

      console.log('[Blog] Fetch result:', data);
      setPosts(data || []);
      console.log('[Blog] Posts set:', data?.length || 0, 'posts');
    } catch (error) {
      console.error('[Blog] Error fetching blog posts:', error);

      // Check if it's a timeout
      if (error.message === 'Request timeout') {
        console.warn('[Blog] Request timed out after 5 seconds');
        toast.error('Unable to load articles. Please check your connection and refresh.');
      } else if (error.message && !error.message.includes('no rows')) {
        toast.error('Failed to load blog posts');
      }

      // Set posts to empty array on error
      setPosts([]);
    } finally {
      setLoading(false);
      console.log('[Blog] Loading complete');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateReadingTime = (content) => {
    if (!content) return 1;
    // Strip HTML tags and count words
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.trim().split(/\s+/).length;
    // Average reading speed: 200 words per minute
    const minutes = Math.ceil(words / 200);
    return minutes;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="/favicon.svg"
                alt="Al-Falaah Logo"
                className="h-8 w-8"
              />
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-gray-900">Al-Falaah Academy</span>
                <span className="text-xs text-gray-500">Blog</span>
              </div>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
            Maqāmāt al-Falāḥī
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Exploring Arabic and Islam for Spiritual Uplift and Intellectual Growth 
          </p>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading articles...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles yet</h3>
              <p className="text-gray-600">Check back soon for insights and articles about Arabic and Islamic studies.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group"
              >
                {/* Featured Image */}
                {post.featured_image && (
                  <div className="aspect-[16/10] bg-gray-100 overflow-hidden rounded-lg mb-5">
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}

                {/* Meta */}
                <div className="flex flex-col gap-1 text-xs text-gray-500 mb-3">
                  <time>{formatDate(post.published_at)}</time>
                  <div className="flex items-center gap-2">
                    <span>{post.author_name}</span>
                    <span>·</span>
                    <span>{calculateReadingTime(post.content)} min read</span>
                  </div>
                </div>

                {/* Content */}
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-emerald-600 transition-colors">
                  {post.title}
                </h2>

                {post.excerpt && (
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                )}

                {/* Read More */}
                <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm group-hover:gap-3 transition-all">
                  <span>Read more</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
