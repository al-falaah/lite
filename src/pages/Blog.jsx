import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Calendar, ArrowRight, Home, Filter, Mail } from 'lucide-react';
import BlogSubscribe from '../components/blog/BlogSubscribe';

const CATEGORIES = [
  'All',
  'Quran & Tafsir',
  'Hadith & Sunnah',
  'Aqeedah',
  'Fiqh',
  'Arabic Language',
  'Seerah',
  'Akhlaq & Adab',
  'Heart Softeners',
  'Ramadan & Seasons',
  'General'
];

const CATEGORY_COLORS = {
  'Quran & Tafsir': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Hadith & Sunnah': 'bg-blue-100 text-blue-700 border-blue-200',
  'Aqeedah': 'bg-purple-100 text-purple-700 border-purple-200',
  'Fiqh': 'bg-amber-100 text-amber-700 border-amber-200',
  'Arabic Language': 'bg-rose-100 text-rose-700 border-rose-200',
  'Seerah': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Akhlaq & Adab': 'bg-teal-100 text-teal-700 border-teal-200',
  'Heart Softeners': 'bg-pink-100 text-pink-700 border-pink-200',
  'Ramadan & Seasons': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'General': 'bg-gray-100 text-gray-700 border-gray-200'
};

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categoryCounts, setCategoryCounts] = useState({});
  const [showSubscribeButton, setShowSubscribeButton] = useState(false);
  const [showSlideInBanner, setShowSlideInBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const subscribeRef = useRef(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    // Filter posts based on selected category
    let filtered = selectedCategory === 'All'
      ? posts
      : posts.filter(post => post.category === selectedCategory);

    // Sort filtered posts: pinned first, then by published_at
    filtered = filtered.sort((a, b) => {
      if ((a.is_pinned && b.is_pinned) || (!a.is_pinned && !b.is_pinned)) {
        return new Date(b.published_at) - new Date(a.published_at);
      }
      return a.is_pinned ? -1 : 1;
    });

    setFilteredPosts(filtered);
  }, [selectedCategory, posts]);

  useEffect(() => {
    // Calculate category counts
    const counts = { 'All': posts.length };
    posts.forEach(post => {
      const category = post.category || 'General';
      counts[category] = (counts[category] || 0) + 1;
    });
    setCategoryCounts(counts);
  }, [posts]);

  useEffect(() => {
    // Check if user has dismissed the banner in this session
    const dismissed = sessionStorage.getItem('subscribeSlideInDismissed');
    if (dismissed) {
      setBannerDismissed(true);
    }
  }, []);

  useEffect(() => {
    // Show/hide floating subscribe button and slide-in banner based on scroll position
    const handleScroll = () => {
      // More reliable scroll calculation for mobile
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const clientHeight = document.documentElement.clientHeight || window.innerHeight;
      const scrollPercent = (scrollY / (scrollHeight - clientHeight)) * 100;

      if (subscribeRef.current) {
        const subscribePosition = subscribeRef.current.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        // Show button when subscribe section is below viewport
        setShowSubscribeButton(subscribePosition > windowHeight);

        // Show slide-in banner after 40% scroll, hide when reaching subscribe section
        // Only show if not dismissed and not at subscribe section
        // Use simpler threshold for mobile reliability
        if (!bannerDismissed && scrollPercent > 40 && subscribePosition > windowHeight + 200) {
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

  const scrollToSubscribe = () => {
    subscribeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDismissBanner = () => {
    setShowSlideInBanner(false);
    setBannerDismissed(true);
    sessionStorage.setItem('subscribeSlideInDismissed', 'true');
  };

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

      // Sort posts: pinned posts first (max 2), then by published_at
      const sortedData = (data || []).sort((a, b) => {
        // If both are pinned or neither is pinned, sort by published_at
        if ((a.is_pinned && b.is_pinned) || (!a.is_pinned && !b.is_pinned)) {
          return new Date(b.published_at) - new Date(a.published_at);
        }
        // Pinned posts come first
        return a.is_pinned ? -1 : 1;
      });

      setPosts(sortedData);
      setFilteredPosts(sortedData);
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
      setFilteredPosts([]);
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

  // JSON-LD structured data for blog listing
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "The FastTrack Madrasah Blog",
    "description": "Insights on Islamic studies, Quran, Arabic language, and spiritual growth from The FastTrack Madrasah",
    "url": "https://www.tftmadrasah.nz/blog",
    "publisher": {
      "@type": "Organization",
      "name": "The FastTrack Madrasah",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.tftmadrasah.nz/favicon.svg"
      }
    },
    "blogPost": posts.slice(0, 10).map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "image": post.featured_image,
      "datePublished": post.published_at,
      "author": {
        "@type": "Person",
        "name": post.author_name
      },
      "url": `https://www.tftmadrasah.nz/blog/${post.slug}`
    }))
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        {/* Basic meta tags */}
        <title>Blog | The FastTrack Madrasah - Islamic Studies & Spiritual Growth</title>
        <meta name="description" content="Explore articles on Islamic studies, Quran, Arabic language, and spiritual development. Learn from qualified teachers at The FastTrack Madrasah." />
        <meta name="keywords" content="Islamic blog, Quran articles, Arabic learning, Islamic studies, spiritual growth, New Zealand" />
        <meta name="robots" content="index, follow, max-image-preview:large" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Blog | The FastTrack Madrasah" />
        <meta property="og:description" content="Explore articles on Islamic studies, Quran, Arabic language, and spiritual development." />
        <meta property="og:url" content="https://www.tftmadrasah.nz/blog" />
        <meta property="og:site_name" content="The FastTrack Madrasah" />
        <meta property="og:locale" content="en_NZ" />
        <meta property="og:image" content="https://www.tftmadrasah.nz/favicon.svg" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Blog | The FastTrack Madrasah" />
        <meta name="twitter:description" content="Explore articles on Islamic studies, Quran, Arabic language, and spiritual development." />
        <meta name="twitter:site" content="@tftmadrasah" />

        {/* Canonical */}
        <link rel="canonical" href="https://www.tftmadrasah.nz/blog" />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="/favicon.svg"
                alt="The FastTrack Logo"
                className="h-8 w-8"
              />
              <div className="flex flex-col leading-none -space-y-1">
                <div className="flex flex-col leading-none -space-y-1">
                  <span className="text-xs sm:text-sm font-brand font-semibold text-gray-900" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                  <span className="text-xs sm:text-sm font-brand font-semibold text-gray-900" style={{letterSpacing: "0.28em"}}>Madrasah</span>
                </div>
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
            The FastTrack Journal
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Reflections on Arabic language and Islam for Spiritual Uplift and Intellectual Growth
          </p>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="lg:grid lg:grid-cols-4 lg:gap-12">
          {/* Sidebar - Categories */}
          <aside className="lg:col-span-1 mb-12 lg:mb-0">
            <div className="lg:sticky lg:top-24">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="h-5 w-5 text-gray-700" />
                <h2 className="text-lg font-bold text-gray-900">Categories</h2>
              </div>

              <nav className="space-y-2">
                {CATEGORIES.map((category) => {
                  const count = categoryCounts[category] || 0;
                  const isActive = selectedCategory === category;

                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg transition-all flex items-center justify-between ${
                        isActive
                          ? 'bg-emerald-600 text-white font-semibold shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm">{category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-emerald-500' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Selected Category Header */}
            {selectedCategory !== 'All' && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCategory}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${CATEGORY_COLORS[selectedCategory]}`}>
                    {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}
                  </span>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading articles...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedCategory === 'All' ? 'No articles yet' : `No articles in ${selectedCategory}`}
                  </h3>
                  <p className="text-gray-600">
                    {selectedCategory === 'All'
                      ? 'Check back soon for insights and articles about Arabic and Islamic studies.'
                      : 'Try selecting a different category.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-2">
                {filteredPosts.map((post) => (
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

                    {/* Category Badge */}
                    {post.category && (
                      <div className="mb-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS['General']}`}>
                          {post.category}
                        </span>
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

            {/* Blog Subscription Section */}
            <div ref={subscribeRef} className="mt-16 sm:mt-20">
              <BlogSubscribe />
            </div>

            {/* Admin Link */}
            <div className="mt-8 text-center">
              <Link
                to="/blog/admin"
                className="text-sm text-gray-400 hover:text-emerald-600 transition-colors"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
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

      {/* Floating Subscribe Button - Shows when subscribe section is off-screen */}
      {showSubscribeButton && !showSlideInBanner && (
        <button
          onClick={scrollToSubscribe}
          className="fixed bottom-6 right-6 z-40 bg-gray-900 text-white px-4 py-2.5 rounded-lg shadow-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          aria-label="Subscribe to newsletter"
        >
          <Mail className="h-4 w-4" />
          <span className="text-sm font-medium hidden sm:inline">Subscribe</span>
        </button>
      )}
    </div>
  );
};

export default Blog;
