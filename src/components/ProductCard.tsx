import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Plus, Star, Heart, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const active = isInWishlist(product.id || '');

  const [added, setAdded] = React.useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group bg-white rounded-3xl overflow-hidden border border-gray-100/50 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-300"
    >
      <div className="relative block aspect-[4/5] overflow-hidden bg-gray-50">
        <Link to={`/product/${product.id}`}>
          <img 
            src={product.imageUrls[0]} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        </Link>
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-600 shadow-sm">
            {product.category}
          </span>
        </div>
        <button 
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className={`absolute top-4 right-4 p-3 rounded-2xl shadow-xl transition-all active:scale-95 z-30 ${
            active 
              ? 'bg-orange-600 text-white shadow-orange-200' 
              : 'bg-white text-gray-900 hover:text-orange-600 hover:scale-110'
          }`}
          title={active ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-5 h-5 ${active ? 'fill-white' : ''}`} />
        </button>
        
        {/* Quick Add Overlay (Desktop) */}
        <div className="absolute inset-x-4 bottom-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:block z-30">
          <button 
            onClick={handleAddToCart}
            disabled={added}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 shadow-2xl ${
              added 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-900 text-white hover:bg-orange-600'
            }`}
          >
            {added ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Quick Add</span>
              </>
            )}
          </button>
        </div>

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
      </div>
      
      <div className="p-4 md:p-6 space-y-2 md:space-y-3">
        <div>
          <div className="hidden md:flex items-center space-x-1 mb-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-3 h-3 fill-orange-400 text-orange-400" />
            ))}
            <span className="text-[10px] font-bold text-gray-400 pl-1">({product.reviewCount || 0})</span>
          </div>
          <Link to={`/product/${product.id}`} className="block">
            <h3 className="text-gray-900 font-bold leading-tight group-hover:text-orange-600 transition-colors line-clamp-2 min-h-[2.5rem] md:min-h-[3rem] text-sm md:text-base italic">
              {product.name}
            </h3>
          </Link>
        </div>
        
        <div className="flex items-center justify-between pt-1 md:pt-2">
          <div className="flex flex-col">
            <span className="text-base md:text-xl font-black text-gray-900 tracking-tighter italic">৳{product.price.toLocaleString()}</span>
            <span className="hidden md:block text-[10px] text-gray-400 line-through font-medium italic">৳{Math.round(product.price * 1.25).toLocaleString()}</span>
          </div>
          <button 
            onClick={handleAddToCart}
            className={`p-3 md:p-4 rounded-2xl transition-all active:scale-90 shadow-lg ${
              added 
                ? 'bg-green-600 text-white shadow-green-200' 
                : 'bg-gray-900 text-white hover:bg-orange-600 shadow-gray-200/50'
            }`}
          >
            {added ? <CheckCircle2 className="w-5 h-5 md:w-6 h-6" /> : <ShoppingCart className="w-5 h-5 md:w-6 h-6" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
