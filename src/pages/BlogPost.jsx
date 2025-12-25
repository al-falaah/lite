import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    console.log('[BlogPost] Fetching post with slug:', slug);

    try {
      // BYPASS SUPABASE CLIENT - Use direct fetch for better reliability
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const url = `${supabaseUrl}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=*&limit=1`;

      console.log('[BlogPost] Direct fetch to:', url);

      // Create the fetch promise
      const fetchPromise = fetch(url, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json'
        }
      })
      .then(async response => {
        console.log('[BlogPost] Response status:', response.status);
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

      console.log('[BlogPost] Fetch result:', data);

      if (!data || data.length === 0) {
        console.error('[BlogPost] No post found with slug:', slug);
        navigate('/blog');
        return;
      }

      setPost(data[0]); // PostgREST returns an array, get first item
      console.log('[BlogPost] Post loaded:', data[0].title);
    } catch (error) {
      console.error('[BlogPost] Error fetching post:', error);

      if (error.message === 'Request timeout') {
        console.warn('[BlogPost] Request timed out after 5 seconds');
      }

      navigate('/blog');
    } finally {
      setLoading(false);
      console.log('[BlogPost] Loading complete');
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

  // Detect if text contains Arabic characters
  const hasArabic = (text) => {
    return /[\u0600-\u06FF]/.test(text);
  };

  // Process content to add RTL support to Arabic text
  const processContentForRTL = (htmlContent) => {
    if (!htmlContent) return htmlContent;

    try {
      // Parse HTML content
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // Process all text-containing elements
      const elements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, strong, em, blockquote, div');

      console.log('[RTL] Processing', elements.length, 'elements');

      elements.forEach((el, index) => {
        const isArabic = hasArabic(el.textContent);

        // Set dir attribute based on content
        if (isArabic) {
          el.setAttribute('dir', 'rtl');
          el.style.direction = 'rtl';
          el.style.textAlign = 'right';
          el.style.unicodeBidi = 'embed';
          console.log('[RTL] Element', index, 'has Arabic (RTL):', el.textContent.substring(0, 50));
        } else {
          el.setAttribute('dir', 'ltr');
          el.style.direction = 'ltr';
          el.style.textAlign = 'left';
        }
      });

      const result = doc.body.innerHTML;
      console.log('[RTL] Processed HTML sample:', result.substring(0, 300));
      return result;
    } catch (error) {
      console.error('[RTL] Error processing content:', error);
      return htmlContent;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="/favicon.svg"
                alt="Al-Falaah Logo"
                className="h-8 w-8"
              />
              <div className="flex flex-col leading-none -space-y-1">
                <div className="flex flex-col leading-none -space-y-1">
                  <span className="text-xs sm:text-sm font-semibold text-gray-900" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900" style={{letterSpacing: "0.28em"}}>Madrasah</span>
                </div>
                <span className="text-xs text-gray-500 mt-0.5">Blog</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/blog"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">All Articles</span>
              </Link>
              <Link
                to="/"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-20">
        {/* Meta Info */}
        <div className="flex flex-col gap-1 text-sm text-gray-500 mb-8">
          <time>{formatDate(post.published_at)}</time>
          <div className="flex items-center gap-2">
            <span>{post.author_name}</span>
            <span>·</span>
            <span>{calculateReadingTime(post.content)} min read</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-12 leading-tight tracking-tight">
          {post.title}
        </h1>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="mb-12 rounded-xl overflow-hidden bg-gray-100">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-auto"
              onError={(e) => {
                console.error('Failed to load featured image:', post.featured_image);
                e.target.parentElement.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Content */}
        <div
          className="blog-content prose prose-xl prose-gray max-w-none
            prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-900
            prose-h2:text-[32px] prose-h2:leading-[1.25] prose-h2:mt-12 prose-h2:mb-4
            prose-h3:text-[24px] prose-h3:leading-[1.35] prose-h3:mt-10 prose-h3:mb-3
            prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:font-semibold prose-strong:text-gray-900
            prose-em:italic prose-em:font-serif
            prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-700
            prose-img:rounded-lg prose-img:my-8"
          dir="auto"
          style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
          dangerouslySetInnerHTML={{ __html: processContentForRTL(post.content) }}
        />

        {/* Author Section */}
        <div className="mt-20 pt-12 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-700">
                  {post.author_name.charAt(0)}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {post.author_name}
              </h3>
              {post.author_bio && (
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {post.author_bio}
                </p>
              )}
              <Link
                to="/apply"
                className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
              >
                Start Your Learning Journey →
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogPost;
