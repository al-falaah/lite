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
    setLoading(true);
    try {
      const { data, error } = await storeProducts.getAll(true); // Only active products
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
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

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <ShoppingBag className="h-6 w-6 text-emerald-600" />
                <div className="flex flex-col leading-none -space-y-1">
                  <span className="text-sm font-semibold text-gray-900">Store</span>
                  <span className="text-xs text-gray-500">Books & Souvenirs</span>
                </div>
              </Link>

              <div className="flex items-center gap-4">
                <Link to="/" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors hidden sm:inline">
                  Home
                </Link>
                <button
                  onClick={goToCheckout}
                  className="relative inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="hidden sm:inline">Cart</span>
                  {getCartCount() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                      {getCartCount()}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Page Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Our Store
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Browse our curated collection of Islamic books and madrasah souvenirs
            </p>
          </div>

          {/* Category Filter */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex flex-wrap gap-2 bg-white rounded-lg p-2 shadow-sm">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products available</h3>
              <p className="text-gray-600 mb-6">
                {selectedCategory === 'All'
                  ? 'Check back soon for new items!'
                  : `No ${selectedCategory.toLowerCase()} available at the moment.`}
              </p>
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  View all products
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                  <div className="p-5">
                    <div className="mb-3">
                      <span className="inline-block px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-100 rounded">
                        {product.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-2xl font-bold text-emerald-600">
                        ${parseFloat(product.price_nzd).toFixed(2)}
                      </p>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock_quantity === 0}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          product.stock_quantity === 0
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                    {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                      <p className="text-xs text-orange-600 mt-2">
                        Only {product.stock_quantity} left in stock
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Back to Home */}
          <div className="mt-12 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
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
