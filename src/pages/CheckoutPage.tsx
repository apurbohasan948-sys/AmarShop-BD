import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { db, auth } from '../services/firebase';
import { districts, bdLocationData } from '../utils/locationData';
import { ShoppingBag, ChevronRight, CheckCircle2, ShieldCheck, Search, Loader2 } from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const CheckoutPage = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { settings } = useStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: profile?.fullName || '',
    phone: '',
    district: '',
    upazila: '',
    street: '',
    paymentMethod: 'bKash' as 'bKash' | 'Nagad',
    transactionId: '',
  });

  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [upazilaList, setUpazilaList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({ ...prev, name: profile.fullName }));
    }
  }, [profile]);

  useEffect(() => {
    if (formData.district) {
      setUpazilaList(bdLocationData[formData.district] || []);
      setDeliveryCharge(formData.district === 'Dhaka' ? 150 : 100);
      setFormData(prev => ({ ...prev, upazila: '' }));
    } else {
      setUpazilaList([]);
      setDeliveryCharge(0);
    }
  }, [formData.district]);

  const cartTotalAmount = cartTotal;
  const discount = appliedCoupon 
    ? (appliedCoupon.discountType === 'percentage' ? (cartTotalAmount * appliedCoupon.value / 100) : appliedCoupon.value)
    : 0;

  const subtotalAfterDiscount = Math.max(0, cartTotalAmount - discount);
  const total = subtotalAfterDiscount + deliveryCharge;

  const handleApplyCoupon = () => {
    setCouponError('');
    const coupon = settings.coupons?.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive);
    
    if (!coupon) {
      setCouponError('Invalid or inactive coupon code.');
      return;
    }

    if (coupon.minSpend && cartTotalAmount < coupon.minSpend) {
      setCouponError(`Min spend for this coupon is ৳${coupon.minSpend}`);
      return;
    }

    setAppliedCoupon(coupon);
    setCouponCode('');
  };
  const isFormValid = formData.name && formData.phone && formData.district && formData.upazila && formData.street && formData.transactionId;

  const verifyTransaction = async () => {
    if (!formData.transactionId) return;
    setVerificationLoading(true);
    setVerificationError('');
    setIsVerified(false);

    try {
      const q = query(
        collection(db, 'verified_transactions'),
        where('transactionId', '==', formData.transactionId),
        where('isUsed', '==', false)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        setIsVerified(true);
      } else {
        setVerificationError('TRX ID not found or already used.');
      }
    } catch (error) {
      console.error(error);
      setVerificationError('Verification failed. Try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !user) return;

    setLoading(true);
    const orderData = {
      customerUid: user.uid,
      customerName: formData.name,
      customerPhone: formData.phone,
      address: {
        district: formData.district,
        upazila: formData.upazila,
        street: formData.street,
      },
      items: cart,
      subtotal: cartTotal,
      deliveryCharge,
      total,
      transactionId: formData.transactionId,
      paymentMethod: formData.paymentMethod,
      paymentStatus: (isVerified ? 'verified' : 'pending') as 'verified' | 'pending',
      orderStatus: 'pending' as const,
      createdAt: serverTimestamp(),
    };

    try {
      // If verified, mark transaction as used
      if (isVerified) {
        const txQ = query(collection(db, 'verified_transactions'), where('transactionId', '==', formData.transactionId));
        const txSnap = await getDocs(txQ);
        if (!txSnap.empty) {
          await updateDoc(doc(db, 'verified_transactions', txSnap.docs[0].id), { isUsed: true });
        }
      }

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Trigger order confirmation email (Mock)
      if (user.email) {
        const { sendOrderConfirmationEmail } = await import('../services/emailService');
        await sendOrderConfirmationEmail({ ...orderData, id: docRef.id }, user.email);
      }

      clearCart();
      navigate(`/orders?success=${docRef.id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4 bg-gray-50">
        <div className="p-6 bg-white rounded-full shadow-2xl">
          <ShoppingBag className="w-20 h-20 text-gray-200" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="text-gray-500 max-w-md text-center italic">Seems like you haven't added any products to your cart yet. Let's find something amazing for you!</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 bg-orange-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-orange-600/30 active:scale-95 transition-all"
        >
          Explore Shop
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-8 overflow-x-auto whitespace-nowrap">
          <span className="hover:text-gray-900 cursor-pointer" onClick={() => navigate('/')}>Home</span>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <span className="hover:text-gray-900 cursor-pointer" onClick={() => navigate('/cart')}>Cart</span>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <span className="text-orange-600 font-semibold">Checkout</span>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Billing & Shipping */}
          <div className="lg:col-span-7 space-y-8">
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Shipping Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                    placeholder="e.g. 01700000000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">District</label>
                  <select
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500/20 transition-all font-medium appearance-none"
                  >
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Upazila / Area</label>
                  <select
                    required
                    disabled={!formData.district}
                    value={formData.upazila}
                    onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500/20 transition-all font-medium appearance-none disabled:opacity-50"
                  >
                    <option value="">Select Upazila</option>
                    {upazilaList.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Street Address / House No.</label>
                  <input
                    type="text"
                    required
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                    placeholder="House, Road, Area details"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <ShieldCheck className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Payment Verification</h2>
              </div>

              <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-6 mb-8 text-sm text-orange-700 leading-relaxed italic">
                <p className="font-bold mb-2 uppercase tracking-wide">Instant Checkout Verification</p>
                <p>Send precisely <span className="font-bold">৳ {total.toLocaleString()}</span> to our {formData.paymentMethod} Personal number:</p>
                <p className="text-lg font-black text-orange-600 mt-1">{formData.paymentMethod === 'bKash' ? settings.bkashNumber : settings.nagadNumber || '01XXXXXXXXX'}</p>
                <p className="mt-2 text-xs opacity-70">Enter TRX ID below to verify instantly. Orders with verified payments are processed 3x faster.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Target Payment Method</label>
                  <div className="flex space-x-4">
                    {['bKash', 'Nagad'].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, paymentMethod: method as any });
                          setIsVerified(false);
                          setVerificationError('');
                        }}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 ${
                          formData.paymentMethod === method ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400 hover:border-orange-200'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Verified Transaction ID</label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        required
                        value={formData.transactionId}
                        onChange={(e) => {
                          setFormData({ ...formData, transactionId: e.target.value });
                          setIsVerified(false);
                          setVerificationError('');
                        }}
                        className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 transition-all font-medium uppercase placeholder:normal-case ${
                          isVerified ? 'ring-2 ring-green-500/20' : ''
                        }`}
                        placeholder="e.g. A1B2C3D4E5"
                      />
                      {isVerified && (
                        <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={verifyTransaction}
                      disabled={!formData.transactionId || verificationLoading || isVerified}
                      className="px-6 bg-gray-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center space-x-2"
                    >
                      {verificationLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Search className="w-3 h-3" />
                      )}
                      <span>{isVerified ? 'Verified' : 'Verify'}</span>
                    </button>
                  </div>
                  {verificationError && (
                    <p className="ml-1 text-[10px] font-bold text-red-500 italic">{verificationError}</p>
                  )}
                  {isVerified && (
                    <p className="ml-1 text-[10px] font-bold text-green-600 italic uppercase tracking-widest">Transaction Authenticated Successfully</p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-8">Order Summary</h2>
              
              <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.selectedVariant?.id || 'none'}`} className="flex space-x-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.imageUrls[0]} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 line-clamp-1">
                        {item.name}
                        {item.selectedVariant && (
                          <span className="ml-2 text-[10px] text-orange-600 font-black uppercase">({item.selectedVariant.name})</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 font-medium">Qty: {item.quantity} × ৳{item.price.toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">৳{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 border-t border-gray-100 pt-6">
                <div className="flex justify-between text-sm font-medium text-gray-500 italic">
                  <span>Cart Items Total</span>
                  <span>৳ {cartTotal.toLocaleString()}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-sm font-black text-green-600 italic">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>- ৳ {discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-medium text-gray-500 italic">
                  <span>Standard Delivery</span>
                  <span>{deliveryCharge ? `৳ ${deliveryCharge}` : 'Select District'}</span>
                </div>

                {!appliedCoupon && (
                  <div className="pt-2">
                    <div className="flex space-x-2">
                      <input 
                        placeholder="Coupon Code" 
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 font-bold text-[10px] uppercase focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                      <button 
                        type="button"
                        onClick={handleApplyCoupon}
                        className="bg-gray-900 text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-orange-600 transition-all"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p className="text-[10px] text-red-500 font-bold italic mt-1 ml-1">{couponError}</p>}
                  </div>
                )}

                <div className="flex justify-between text-xl font-black text-gray-900 border-t border-gray-100 pt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Total Payable</span>
                    <span className="text-orange-600 leading-none">৳ {total.toLocaleString()}</span>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-orange-600 opacity-20 self-center" />
                </div>
              </div>

              <button
                type="submit"
                disabled={!isFormValid || loading}
                className={`w-full mt-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-2 ${
                  isFormValid && !loading 
                    ? 'bg-orange-600 text-white shadow-orange-600/30 hover:bg-orange-700' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <span className="animate-pulse">Processing Order...</span>
                ) : (
                  <>
                    <span>Confirm Order</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              {!isFormValid && !loading && (
                <p className="text-[10px] text-center text-red-400 mt-4 font-bold uppercase tracking-widest">Please fill all fields & payment details</p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
