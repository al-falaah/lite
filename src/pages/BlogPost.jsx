import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Home, Share2, Facebook, Twitter, Linkedin, Link2, Mail } from 'lucide-react';
import BlogSubscribe from '../components/blog/BlogSubscribe';

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [showSlideInBanner, setShowSlideInBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const subscribeRef = useRef(null);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  useEffect(() => {
    // Increment view count when post is loaded
    if (post?.id) {
      incrementViewCount(post.id);
    }
  }, [post?.id]);

  useEffect(() => {
    // Check if user has dismissed the banner in this session
    const dismissed = sessionStorage.getItem('subscribeSlideInDismissedPost');
    if (dismissed) {
      setBannerDismissed(true);
    }
  }, []);

  useEffect(() => {
    // Show slide-in banner based on scroll position
    const handleScroll = () => {
      // More reliable scroll calculation for mobile
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const clientHeight = document.documentElement.clientHeight || window.innerHeight;
      const scrollPercent = (scrollY / (scrollHeight - clientHeight)) * 100;

      if (subscribeRef.current) {
        const subscribePosition = subscribeRef.current.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;

        // Show slide-in banner after 50% scroll, hide when reaching subscribe section
        if (!bannerDismissed && scrollPercent > 50 && subscribePosition > windowHeight + 200) {
          setShowSlideInBanner(true);
        } else {
          setShowSlideInBanner(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll); // Handle mobile address bar changes
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [bannerDismissed]);

  const incrementViewCount = async (postId) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Use RPC to increment view count atomically
      await fetch(`${supabaseUrl}/rest/v1/rpc/increment_blog_views`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ post_id: postId })
      });

      console.log('[BlogPost] View count incremented for post:', postId);
    } catch (error) {
      console.error('[BlogPost] Error incrementing view count:', error);
      // Don't show error to user - this is background operation
    }
  };

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

      // Fetch related posts (exclude current post)
      fetchRelatedPosts(data[0].id, supabaseUrl, anonKey);
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

  const fetchRelatedPosts = async (currentPostId, supabaseUrl, anonKey) => {
    try {
      // Fetch all other published posts, ordered by published date (newest first)
      const url = `${supabaseUrl}/rest/v1/blog_posts?status=eq.published&id=not.eq.${currentPostId}&select=id,title,slug,excerpt,featured_image,published_at,author_name,category&order=published_at.desc&limit=10`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('[BlogPost] Failed to fetch related posts');
        return;
      }

      const data = await response.json();
      console.log('[BlogPost] Related posts fetched:', data.length);

      // Determine how many to show based on total count
      let postsToShow = [];
      if (data.length === 1) {
        postsToShow = []; // Show none if only 1 other article
      } else if (data.length === 2) {
        postsToShow = [data[0]]; // Show 1 if 2 total articles
      } else if (data.length >= 3) {
        postsToShow = [data[0], data[1]]; // Show 2 if 3 or more articles
      }

      setRelatedPosts(postsToShow);
    } catch (error) {
      console.error('[BlogPost] Error fetching related posts:', error);
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

  const handleShare = async (platform) => {
    const url = window.location.href;
    const title = post?.title || 'The FastTrack Madrasah Blog';
    const description = post?.excerpt || '';

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' - ' + url)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description + '\n\n' + url)}`
    };

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    } else if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: url
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleDismissBanner = () => {
    setShowSlideInBanner(false);
    setBannerDismissed(true);
    sessionStorage.setItem('subscribeSlideInDismissedPost', 'true');
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

  // Generate excerpt from content for description
  const getExcerpt = (content, length = 160) => {
    if (!content) return '';
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const siteUrl = window.location.origin;
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  // Use absolute URL for OG image - fallback to a larger, more visible image
  const imageUrl = post.featured_image || 'https://www.tftmadrasah.nz/favicon.png';
  const description = post.excerpt || getExcerpt(post.content);

  // JSON-LD structured data for Google
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": description,
    "image": imageUrl,
    "datePublished": post.published_at,
    "dateModified": post.updated_at || post.published_at,
    "author": {
      "@type": "Person",
      "name": post.author_name
    },
    "publisher": {
      "@type": "Organization",
      "name": "The FastTrack Madrasah",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.tftmadrasah.nz/favicon.svg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl
    },
    "articleSection": post.category || "Islamic Education",
    "keywords": post.tags ? post.tags.join(", ") : "Islamic studies, Quran, Arabic, Online learning"
  };

  // Breadcrumb structured data
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.tftmadrasah.nz/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://www.tftmadrasah.nz/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": postUrl
      }
    ]
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        {/* Basic meta tags */}
        <title>{post.title} | The FastTrack Madrasah Blog</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={post.tags ? post.tags.join(", ") : "Islamic studies, Quran, Arabic, online learning, New Zealand"} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

        {/* Open Graph meta tags for Facebook, WhatsApp, etc. */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={postUrl} />
        <meta property="og:site_name" content="The FastTrack Madrasah" />
        <meta property="og:locale" content="en_NZ" />
        <meta property="article:published_time" content={post.published_at} />
        <meta property="article:modified_time" content={post.updated_at || post.published_at} />
        <meta property="article:author" content={post.author_name} />
        {post.category && <meta property="article:section" content={post.category} />}
        {post.tags && post.tags.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))}

        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />
        <meta name="twitter:site" content="@tftmadrasah" />

        {/* Additional meta tags */}
        <meta name="author" content={post.author_name} />
        <link rel="canonical" href={postUrl} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbData)}
        </script>
      </Helmet>

      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="/favicon.svg"
                alt="The FastTrack Madrasah"
                className="h-8 w-8"
              />
              <div className="flex flex-col leading-none -space-y-1">
                <div className="flex flex-col leading-none -space-y-1">
                  <span className="text-xs sm:text-sm md:text-base font-brand font-semibold text-gray-900" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                  <span className="text-xs sm:text-sm md:text-base font-brand font-semibold text-gray-900" style={{letterSpacing: "0.28em"}}>Madrasah</span>
                </div>
                {/* <span className="text-xs sm:text-sm text-gray-500 mt-0.5">Blog</span> */}
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
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
          {post.title}
        </h1>

        {/* Share Buttons */}
        <div className="flex items-center gap-3 mb-12 pb-8 border-b border-gray-200">
          <span className="text-sm text-gray-600 font-medium">Share:</span>
          <div className="flex items-center gap-2">
            {/* WhatsApp */}
            <button
              onClick={() => handleShare('whatsapp')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Share on WhatsApp"
            >
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </button>

            {/* Facebook */}
            <button
              onClick={() => handleShare('facebook')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Share on Facebook"
            >
              <Facebook className="w-5 h-5 text-gray-600" />
            </button>

            {/* Twitter */}
            <button
              onClick={() => handleShare('twitter')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Share on Twitter"
            >
              <Twitter className="w-5 h-5 text-gray-600" />
            </button>

            {/* LinkedIn */}
            <button
              onClick={() => handleShare('linkedin')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Share on LinkedIn"
            >
              <Linkedin className="w-5 h-5 text-gray-600" />
            </button>

            {/* Email */}
            <button
              onClick={() => handleShare('email')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Share via Email"
            >
              <Mail className="w-5 h-5 text-gray-600" />
            </button>

            {/* Copy Link */}
            <button
              onClick={() => handleShare('copy')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
              title={copySuccess ? 'Copied!' : 'Copy Link'}
            >
              {copySuccess ? (
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <Link2 className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Native Share (mobile) */}
            {navigator.share && (
              <button
                onClick={() => handleShare('native')}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors sm:hidden"
                title="Share"
              >
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
        </div>

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

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-8">
              Related Articles
            </h3>

            {/* Mobile Layout - Vertical Stack */}
            <div className="md:hidden space-y-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.slug}`}
                  className="block group"
                >
                  <div className="flex gap-4">
                    {relatedPost.featured_image && (
                      <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={relatedPost.featured_image}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {relatedPost.category && (
                        <span className="inline-block px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded mb-2">
                          {relatedPost.category}
                        </span>
                      )}
                      <h4 className="text-base font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-1">
                        {relatedPost.title}
                      </h4>
                      {relatedPost.excerpt && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop/Tablet Layout - Grid */}
            <div className="hidden md:grid md:grid-cols-2 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.slug}`}
                  className="group"
                >
                  <article className="h-full flex flex-col">
                    {relatedPost.featured_image && (
                      <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 mb-4">
                        <img
                          src={relatedPost.featured_image}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      {relatedPost.category && (
                        <span className="inline-block px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded mb-3">
                          {relatedPost.category}
                        </span>
                      )}
                      <h4 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-2">
                        {relatedPost.title}
                      </h4>
                      {relatedPost.excerpt && (
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {relatedPost.excerpt}
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center md:text-left">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
              >
                View All Articles →
              </Link>
            </div>
          </div>
        )}
      </article>

      {/* Blog Subscription Section */}
      <div ref={subscribeRef} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <BlogSubscribe />
      </div>

      {/* Slide-in Subscribe Banner - Bottom */}
      {showSlideInBanner && !bannerDismissed && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300"
          style={{
            animation: 'slideInFromBottom 0.3s ease-out',
            willChange: 'transform'
          }}
        >
          <div className="bg-white border-t border-gray-200 shadow-lg">
            <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
              <BlogSubscribe inline={false} onClose={handleDismissBanner} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPost;
