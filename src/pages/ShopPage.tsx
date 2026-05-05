import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import { SlidersHorizontal, ShoppingBag, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useStore } from '../contexts/StoreContext';

const ShopPage = () => {
  const { settings } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>(searchParams.get('category') || 'All');
  const [sortBy, setSortBy] = useState<string>('newest');

  const searchTerm = searchParams.get('q') || '';

  useEffect(() => {
    const fetchMeta = async () => {
      const catSnap = await getDocs(collection(db, 'categories'));
      const catList = catSnap.docs.map(doc => (doc.data() as Category).name);
      setCategories(['All', ...catList]);
    };
    fetchMeta();
  }, []);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    let result = [...products];

    // Filter
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory);
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
  }, [searchTerm, activeCategory, sortBy, products]);

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

        {/* Filters */}
        <div className="flex overflow-x-auto pb-8 space-x-3 no-scrollbar scroll-smooth -mx-4 px-4 md:mx-0 md:px-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap active:scale-95 min-w-[120px] md:min-w-0 ${
                activeCategory === cat 
                  ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/20' 
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

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
