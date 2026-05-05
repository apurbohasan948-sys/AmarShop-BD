import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingBag, Trash2, ArrowRight, Package } from 'lucide-react';

const WishlistPage = () => {
  const { items, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="mb-12">
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter italic">Your Wishlist</h1>
          <p className="text-gray-400 font-medium italic mt-2">Saved pieces waiting for you.</p>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {items.map((product, i) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500"
                >
                  <div className="aspect-[4/5] relative overflow-hidden bg-gray-50">
                    <img
                      src={product.imageUrls[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <button
                      onClick={() => toggleWishlist(product)}
                      className="absolute top-6 right-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl text-orange-600 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-orange-600 hover:text-white"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                      <button
                        onClick={() => {
                          addToCart(product);
                          toggleWishlist(product);
                        }}
                        className="w-full bg-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Move to Bag</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mb-1">{product.category}</p>
                        <Link to={`/product/${product.id}`} className="text-xl font-black text-gray-900 tracking-tight hover:text-orange-600 transition-colors line-clamp-1">{product.name}</Link>
                      </div>
                      <p className="text-lg font-black text-gray-900 italic">৳{product.price.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2 group/btn hover:text-gray-900 transition-colors"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-gray-50/50 rounded-[4rem] py-32 text-center border-2 border-dashed border-gray-100">
            <div className="inline-flex p-8 bg-white rounded-[2.5rem] shadow-sm mb-6">
              <Heart className="w-12 h-12 text-gray-200" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Your wishlist is empty</h2>
            <p className="text-gray-400 font-medium italic mt-2 mb-10">Start saving your favorite items today.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-900 text-white px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center space-x-3 mx-auto hover:bg-orange-600 transition-all active:scale-95 shadow-xl shadow-gray-900/10"
            >
              <Package className="w-4 h-4" />
              <span>Explore Shop</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
