import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, ShoppingCart, Package } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { storeProducts } from '../services/supabase';
import { toast } from 'sonner';

const CATEGORIES = ['All', 'Books', 'Souvenirs', 'Other'];

const StorePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetchProducts();
    loadCart();
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('store_cart', JSON.stringify(cart));
  }, [cart]);

  const loadCart = () => {
    const savedCart = localStorage.getItem('store_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart:', e);
      }
    }
  };

  const fetchProducts = async () => {
    let progressInterval;
    try {
      setLoading(true);
      setLoadingProgress(0);

      // Simulate progress
      progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) return 100;
          if (prev >= 90) return prev;
          return Math.min(prev + Math.random() * 15, 100);
        });
      }, 300);

      const { data, error } = await storeProducts.getAll(true); // Only active products
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      // Increment quantity
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      toast.success(`Added another ${product.name} to cart`);
    } else {
      // Add new item
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        price: parseFloat(product.price_nzd),
        quantity: 1,
        imageUrl: product.image_url
      }]);
      toast.success(`${product.name} added to cart`);
    }
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const goToCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/store/order');
  };

  return (
    <>
      <Helmet>
        <title>Store | The FastTrack Madrasah</title>
        <meta name="description" content="Browse Islamic books and madrasah souvenirs at The FastTrack Madrasah store" />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-2.5 group">
                <ShoppingBag className="h-6 w-6 text-emerald-600 transition-transform group-hover:scale-105" />
                <div className="flex flex-col leading-tight -space-y-0.5">
                  <span className="text-sm font-semibold text-gray-900">Store</span>
                  <span className="text-xs text-gray-500">Books & Souvenirs</span>
                </div>
              </Link>

              <div className="flex items-center gap-4">
                <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:inline">
                  Home
                </Link>
                <button
                  onClick={goToCheckout}
                  className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium shadow-sm hover:shadow-md"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="hidden sm:inline">Cart</span>
                  {getCartCount() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white">
                      {getCartCount()}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Our Store
            </h1>
            <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
              Browse our curated collection of Islamic books and madrasah souvenirs
            </p>
          </div>

          {/* Category Filter */}
          <div className="mb-12 flex justify-center">
            <div className="inline-flex flex-wrap gap-2 bg-gray-50 rounded-full p-1.5 border border-gray-200">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedCategory === category
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="relative w-24 h-24 inline-block">
                <svg className="w-24 h-24" viewBox="0 0 80 80">
                  <circle
                    className="text-gray-200"
                    strokeWidth="6"
                    stroke="currentColor"
                    fill="transparent"
                    r="34"
                    cx="40"
                    cy="40"
                  />
                  <circle
                    className="text-emerald-600"
                    strokeWidth="6"
                    strokeDasharray={213.628}
                    strokeDashoffset={213.628 - (213.628 * loadingProgress) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="34"
                    cx="40"
                    cy="40"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-700">
                    {Math.round(loadingProgress)}%
                  </span>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                {loadingProgress < 30 && 'Connecting...'}
                {loadingProgress >= 30 && loadingProgress < 60 && 'Loading products...'}
                {loadingProgress >= 60 && loadingProgress < 90 && 'Processing...'}
                {loadingProgress >= 90 && 'Almost there...'}
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No products available</h3>
              <p className="text-gray-600 mb-8 text-base">
                {selectedCategory === 'All'
                  ? 'Check back soon for new items!'
                  : `No ${selectedCategory.toLowerCase()} available at the moment.`}
              </p>
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-semibold transition-all shadow-sm"
                >
                  View all products
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group cursor-pointer"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-50 overflow-hidden rounded-xl mb-4 border border-gray-200">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full flex items-center justify-center ${product.image_url ? 'hidden' : 'flex'}`}
                    >
                      <Package className="h-16 w-16 text-gray-300" />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <p className="text-xl font-bold text-gray-900">
                          ${parseFloat(product.price_nzd).toFixed(2)}
                        </p>
                        {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                          <p className="text-xs text-orange-600 mt-0.5 font-medium">
                            Only {product.stock_quantity} left
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        disabled={product.stock_quantity === 0}
                        className={`px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm ${
                          product.stock_quantity === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md'
                        }`}
                      >
                        {product.stock_quantity === 0 ? 'Sold Out' : 'Add'}
                      </button>
                    </div>
                    
                    <div className="pt-1">
                      <span className="inline-block px-2.5 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full">
                        {product.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Back to Home */}
          <div className="mt-16 pt-8 border-t border-gray-200 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default StorePage;
