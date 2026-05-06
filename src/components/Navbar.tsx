import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Store, LogOut, LayoutDashboard, Heart, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useStore } from '../contexts/StoreContext';
import { auth } from '../services/firebase';

const Navbar = () => {
  const { user, isAdmin, profile } = useAuth();
  const { cart } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { settings } = useStore();
  const navigate = useNavigate();

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-gray-900 p-2 rounded-xl group-hover:bg-orange-600 transition-all">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tighter italic uppercase">{settings.storeName}</span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative group">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search premium pieces..."
                className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-transparent rounded-full text-sm focus:ring-2 focus:ring-orange-600/10 focus:bg-white focus:border-orange-100 transition-all font-medium"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length > 1) {
                    navigate(`/?q=${val}`);
                  } else if (val.length === 0) {
                    navigate('/');
                  }
                }}
              />
              <Search className="absolute left-4 top-2.5 w-4 h-4 text-gray-300 group-focus-within:text-orange-600 transition-colors" />
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/track" className="flex items-center space-x-2 px-4 py-2 bg-gray-50/50 rounded-full border border-gray-100 hover:border-orange-100 transition-all text-gray-400 hover:text-orange-600">
              <Truck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Track</span>
            </Link>

            <Link to="/wishlist" className="relative group p-2">
              <Heart className="w-6 h-6 text-gray-700 group-hover:text-orange-600 transition-colors" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative group p-2">
              <ShoppingCart className="w-6 h-6 text-gray-700 group-hover:text-orange-600 transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/profile"
                  className="flex items-center space-x-2 p-1 pl-3 bg-gray-50 rounded-full border border-gray-100 hover:border-orange-200 transition-all group"
                >
                  <span className="text-xs font-black text-gray-900 uppercase tracking-tighter hidden lg:block">{profile?.fullName?.split(' ')[0] || 'Member'}</span>
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-100 group-hover:bg-orange-600 group-hover:border-orange-600 transition-all">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-gray-700 group-hover:text-white" />
                    )}
                  </div>
                </Link>
              </div>
            ) : (
              <Link
                to="/auth"
                className="bg-orange-600 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 active:scale-95"
              >
                Login / Register
              </Link>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center space-x-3">
            <Link to="/wishlist" className="relative p-2 text-gray-700 active:text-orange-600 transition-colors">
              <Heart className="w-6 h-6" />
              {wishlistItems.length > 0 && (
                <span className="absolute top-1 right-1 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative p-2 text-gray-700 active:text-orange-600 transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <Link 
                to="/profile"
                className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 active:bg-orange-600 active:border-orange-600 group transition-all"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-gray-400 group-active:text-white" />
                )}
              </Link>
            ) : (
              <Link to="/auth" className="p-2 text-gray-400 active:text-orange-600">
                <User className="w-6 h-6" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
