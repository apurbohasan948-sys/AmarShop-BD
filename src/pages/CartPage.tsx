import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, appliedCoupon, setAppliedCoupon } = useCart();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async () => {
    setCouponError('');
    setIsApplying(true);
    
    try {
      const q = query(
        collection(db, 'coupons'),
        where('code', '==', couponCode.toUpperCase()),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setCouponError('Invalid or inactive code.');
        return;
      }

      const coupon = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;

      if (coupon.minSpend && cartTotal < coupon.minSpend) {
        setCouponError(`Min spend: ৳${coupon.minSpend}`);
        return;
      }

      setAppliedCoupon(coupon);
      setCouponCode('');
    } catch (err) {
      setCouponError('System error. Try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const discount = appliedCoupon 
    ? (appliedCoupon.discountType === 'percentage' 
        ? (cartTotal * appliedCoupon.value) / 100 
        : appliedCoupon.value)
    : 0;

  const finalTotal = Math.max(0, cartTotal - discount);

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6 px-4 bg-gray-50">
        <div className="p-10 bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50">
          <ShoppingBag className="w-24 h-24 text-gray-100" />
        </div>
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Your cart is empty</h2>
        <p className="text-gray-400 font-medium italic text-center max-w-sm">Looks like you haven't made your choice yet. Explore our latest collections!</p>
        <Link 
          to="/"
          className="bg-orange-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-orange-600/30 hover:bg-orange-700 transition-all active:scale-95"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-12">Shopping Cart <span className="text-orange-600">({cart.length})</span></h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div 
                  key={`${item.id}-${item.selectedVariant?.id || 'none'}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 group"
                >
                  <div className="w-32 h-32 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 relative">
                    <img src={item.imageUrls[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-1">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{item.name}</h3>
                      {item.selectedVariant && (
                        <span className="inline-block self-center md:self-auto text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                          {item.selectedVariant.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-400 italic mb-4">{item.category}</p>
                    <div className="inline-flex items-center space-x-4 bg-gray-50 p-2 rounded-xl">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedVariant?.id)}
                        className="p-1 hover:text-orange-600 transition-colors disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="font-black text-gray-900 w-8 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedVariant?.id)}
                        className="p-1 hover:text-orange-600 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center md:items-end space-y-4">
                    <p className="text-2xl font-black text-gray-900 tracking-tight">৳{(item.price * item.quantity).toLocaleString()}</p>
                    <button 
                      onClick={() => removeFromCart(item.id, item.selectedVariant?.id)}
                      className="p-3 text-red-100 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Checkout Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-8">Summary</h2>
              
              <div className="space-y-4 border-b border-gray-100 pb-8 mb-8">
                <div className="flex justify-between text-gray-500 font-medium italic">
                  <span>Subtotal</span>
                  <span>৳ {cartTotal.toLocaleString()}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-bold italic">
                    <div className="flex items-center space-x-2">
                       <span>Discount ({appliedCoupon.code})</span>
                       <button onClick={() => setAppliedCoupon(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                    <span>- ৳ {discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-500 font-medium italic">
                  <span>Estimated Tax</span>
                  <span>৳ 0</span>
                </div>
              </div>

              <div className="flex justify-between text-3xl font-black text-gray-900 mb-10 tracking-tighter">
                <span>Total</span>
                <span className="text-orange-600">৳ {finalTotal.toLocaleString()}</span>
              </div>

              {/* Coupon UI */}
              {!appliedCoupon && (
                <div className="mb-10">
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      placeholder="Coupon Code" 
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-600/20 font-bold placeholder:italic"
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      disabled={!couponCode || isApplying}
                      className="px-6 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-orange-600 transition-all"
                    >
                      {isApplying ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-2 tracking-widest">{couponError}</p>}
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-gray-900/20 active:scale-95 flex items-center justify-center space-x-2"
                >
                  <span>Go to Checkout</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-white text-gray-900 border-2 border-gray-100 py-5 rounded-2xl font-black text-lg transition-all hover:bg-gray-50 active:scale-95 flex items-center justify-center space-x-2"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                  <span>Continue Shopping</span>
                </button>
              </div>

              <div className="mt-8 p-4 bg-orange-50 rounded-2xl border border-orange-100 italic text-xs text-orange-700">
                <p>💡 Tip: Delivery charges will be calculated at checkout based on your district.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
