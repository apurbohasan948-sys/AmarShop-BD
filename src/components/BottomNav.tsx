import React from 'react';
import { NavLink } from 'react-router-dom';
import { Store, Heart, ShoppingBag, ClipboardList, User } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

const BottomNav = () => {
  const { cart } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { user } = useAuth();
  
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { to: '/', icon: Store, label: 'Shop' },
    { to: '/wishlist', icon: Heart, label: 'Wishlist', count: wishlistItems.length },
    { to: '/cart', icon: ShoppingBag, label: 'Cart', count: cartCount },
    { to: '/orders', icon: ClipboardList, label: 'Orders' },
    { to: '/auth', icon: User, label: 'Profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <nav className="bg-white/80 backdrop-blur-2xl border border-gray-100 rounded-[2.5rem] shadow-[0_-8px_32px_rgba(0,0,0,0.05)] flex justify-around items-center p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              relative flex flex-col items-center p-3 rounded-2xl transition-all duration-300
              ${isActive ? 'text-orange-600 bg-orange-50/50' : 'text-gray-400 active:scale-95'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.count !== undefined && item.count > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 bg-gray-900 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white"
                  >
                    {item.count}
                  </motion.span>
                )}
                <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-0 group-active:opacity-100 transition-opacity">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default BottomNav;
