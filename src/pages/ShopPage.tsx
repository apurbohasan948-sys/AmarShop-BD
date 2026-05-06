import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import { SlidersHorizontal, ShoppingBag, Search, X, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useStore } from '../contexts/StoreContext';

const ShopPage = () => {
  const navigate = useNavigate();
  const { settings, loading: storeLoading } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>(searchParams.get('category') || 'All');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState(false);

  const searchTerm = searchParams.get('q') || '';

  useEffect(() => {
    if (storeLoading) return;
    const fetchMeta = async () => {
      const catSnap = await getDocs(collection(db, 'categories'));
      const catList = catSnap.docs.map(doc => (doc.data() as Category).name);
      setCategories(['All', ...catList]);
    };
    fetchMeta();
  }, [storeLoading]);

  useEffect(() => {
    if (storeLoading) return;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'products'), where('isActive', '==', true));
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(fetched);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [storeLoading]);

  useEffect(() => {
    if (storeLoading) return;
    let result = [...products];

    // Filter
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory);
    }
    if (minPrice !== '') {
      result = result.filter(p => p.price >= parseFloat(minPrice));
    }
    if (maxPrice !== '') {
      result = result.filter(p => p.price <= parseFloat(maxPrice));
    }
    if (inStockOnly) {
      result = result.filter(p => (p.stock || 0) > 0);
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-az':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        result.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }

    setFilteredProducts(result);
  }, [searchTerm, activeCategory, sortBy, products, storeLoading, minPrice, maxPrice, inStockOnly]);

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Banner */}
      <section className="relative h-[60vh] md:h-[75vh] w-full overflow-hidden mb-12">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <img 
            src={settings.heroBannerUrl} 
            className="w-full h-full object-cover" 
            alt="Hero banner" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/40 to-transparent" />
        </motion.div>
        
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="max-w-2xl"
            >
              <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase leading-none mb-6">
                {settings.heroBannerTitle?.split(' ').map((word, i) => (
                  <span key={i} className={i === 1 ? "text-orange-500 italic block" : "block"}>{word}</span>
                ))}
              </h2>
              <p className="text-gray-300 text-lg md:text-xl font-medium italic mb-10 max-w-lg">
                {settings.heroBannerSubtitle}
              </p>
              <div className="flex space-x-6">
                <button 
                  onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-10 py-5 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white hover:text-gray-900 transition-all shadow-2xl shadow-orange-600/20 active:scale-95"
                >
                  Shop Now
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div id="collection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 space-y-6 md:space-y-0">
          <div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter italic">The Collection</h1>
            <p className="text-gray-400 font-medium italic">Found {filteredProducts.length} items matching your vibe</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchParams({ q: e.target.value })}
                placeholder="Search..."
                className="pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-600/20 font-medium w-full"
              />
              {searchTerm && (
                <button onClick={() => setSearchParams({})} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border ${
                showFilters 
                  ? 'bg-gray-900 text-white border-gray-900 shadow-xl shadow-gray-900/20' 
                  : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>

            <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest text-gray-600 cursor-pointer py-2 pl-4 pr-10"
              >
                <option value="newest">Latest arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-az">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex overflow-x-auto pb-4 space-x-3 no-scrollbar scroll-smooth -mx-4 px-4 md:mx-0 md:px-0 mb-4 border-b border-gray-50">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap active:scale-95 min-w-[100px] md:min-w-0 ${
                activeCategory === cat 
                  ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' 
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Expandable Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-12 border-b border-gray-50 bg-gray-50/50 rounded-3xl"
            >
              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Price Range */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 italic">Price Range</h4>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="number" 
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-600/20"
                    />
                    <span className="text-gray-300">/</span>
                    <input 
                      type="number" 
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-600/20"
                    />
                  </div>
                </div>

                {/* Availability */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 italic">Availability</h4>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div 
                      onClick={() => setInStockOnly(!inStockOnly)}
                      className={`w-12 h-6 rounded-full relative transition-colors ${inStockOnly ? 'bg-orange-600' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${inStockOnly ? 'translate-x-6' : ''}`} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-gray-600">In Stock Only</span>
                  </label>
                </div>

                {/* Reset */}
                <div className="flex items-end justify-end">
                  <button 
                    onClick={() => {
                      setMinPrice('');
                      setMaxPrice('');
                      setInStockOnly(false);
                      setActiveCategory('All');
                    }}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-orange-600 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-12">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-[4/5] bg-gray-50 rounded-[2rem] md:rounded-[2.5rem]" />
                <div className="h-4 bg-gray-50 rounded-full w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-12"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="py-32 text-center bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-100">
            <div className="p-8 bg-white rounded-full inline-block shadow-2xl mb-8">
              <ShoppingBag className="w-12 h-12 text-gray-200" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">No items found</h3>
            <p className="text-gray-400 font-medium italic mt-2">Try adjusting your filters or search terms.</p>
            <button 
              onClick={() => { setActiveCategory('All'); setSearchParams({}); }}
              className="mt-8 text-orange-600 font-black border-b-2 border-orange-600 pb-1 hover:text-orange-700 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
