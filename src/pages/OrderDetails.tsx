import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Order } from '../types';
import { motion } from 'motion/react';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  MapPin, 
  Phone, 
  User, 
  ShoppingBag,
  CreditCard,
  Calendar,
  Hash
} from 'lucide-react';

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const orderRef = doc(db, 'orders', id);
        const snap = await getDoc(orderRef);
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() } as Order);
        } else {
          setError('Order not found.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const steps = [
    { id: 'pending', label: 'Placed', icon: Clock },
    { id: 'processing', label: 'Processing', icon: Package },
    { id: 'shipped', label: 'Shipped', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];

  const getStatusStep = (status: string) => {
    const idx = steps.findIndex(s => s.id === status);
    return idx === -1 ? 0 : idx;
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600 animate-pulse text-center">Decrypting Order Metadata</p>
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 text-center max-w-md w-full">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <Hash className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Identity Not Found</h2>
        <p className="text-gray-400 font-medium italic mb-8 leading-relaxed">{error || 'The requested order sequence does not exist in our secure archives.'}</p>
        <Link 
          to="/orders" 
          className="inline-flex items-center space-x-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to List</span>
        </Link>
      </div>
    </div>
  );

  const currentStepIndex = getStatusStep(order.orderStatus);

  return (
    <div className="min-h-screen bg-gray-50/30 py-12 px-4 md:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <Link 
              to="/orders" 
              className="group inline-flex items-center space-x-2 text-gray-400 hover:text-orange-600 transition-colors mb-6"
            >
              <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Back to History</span>
            </Link>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter italic uppercase">
              Order <span className="text-orange-600">Details</span>
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Order Identifier</p>
            <p className="text-sm font-mono font-black text-gray-900 bg-white px-4 py-2 rounded-xl border border-gray-100">#{order.id?.toUpperCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Status & Information */}
          <div className="lg:col-span-8 space-y-8">
            {/* 1. Status Tracker Card */}
            <section className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-gray-100 overflow-hidden relative">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center">
                  <div className="w-2 h-2 rounded-full bg-orange-600 mr-2 animate-pulse" />
                  Live Tracker
                </h3>
                {order.orderStatus === 'cancelled' && (
                  <span className="px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
                    Cancelled
                  </span>
                )}
              </div>

              {order.orderStatus !== 'cancelled' ? (
                <div className="relative mb-16 mt-8">
                  {/* Progress Line */}
                  <div className="absolute top-8 left-0 w-full h-1.5 bg-gray-100 rounded-full" />
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                    className="absolute top-8 left-0 h-1.5 bg-orange-600 rounded-full shadow-[0_0_20px_rgba(234,88,12,0.5)] transition-all duration-1000 ease-out z-0"
                  />

                  <div className="relative flex justify-between items-center z-10">
                    {steps.map((step, idx) => {
                      const isCompleted = idx <= currentStepIndex;
                      const isActive = idx === currentStepIndex;
                      const Icon = step.icon;

                      return (
                        <div key={step.id} className="flex flex-col items-center">
                          <div className="relative">
                            <motion.div 
                              initial={false}
                              animate={{ 
                                scale: isActive ? 1.25 : 1,
                                backgroundColor: isCompleted ? '#ea580c' : '#ffffff',
                                borderColor: isCompleted ? '#ea580c' : '#f3f4f6'
                              }}
                              className={`w-16 h-16 rounded-[1.75rem] border-4 flex items-center justify-center transition-all duration-500 shadow-xl ${
                                isCompleted ? 'shadow-orange-500/20' : 'shadow-gray-200/5'
                              }`}
                            >
                              <Icon className={`w-7 h-7 transition-colors duration-500 ${isCompleted ? 'text-white' : 'text-gray-300'} ${isActive ? 'animate-pulse' : ''}`} />
                            </motion.div>
                            
                            {isActive && (
                              <div className="absolute -inset-2 bg-orange-600/10 rounded-[2.25rem] animate-ping -z-10" />
                            )}
                            
                            {isCompleted && !isActive && (
                              <div className="absolute -top-2 -right-2 bg-green-500 rounded-xl p-1.5 border-4 border-white shadow-lg">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-8 text-center hidden sm:block">
                            <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 transition-colors duration-500 ${isCompleted ? 'text-gray-900' : 'text-gray-300'}`}>
                              {step.label}
                            </h4>
                            {isActive && (
                              <motion.p 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[8px] font-black text-orange-600 uppercase tracking-widest italic"
                              >
                                Current Status
                              </motion.p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 flex items-center space-x-6">
                  <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center">
                    <Hash className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-red-600 uppercase tracking-widest mb-1">Termination Sequence Active</h4>
                    <p className="text-xs text-red-400 font-medium italic">This order sequence was aborted. No further logistical processing will occur.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-10 border-t border-gray-50">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Date Placed</p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <p className="text-sm font-bold text-gray-900">
                      {order.createdAt?.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Payment Method</p>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-orange-600" />
                    <p className="text-sm font-bold text-gray-900 capitalize">{order.paymentMethod}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Payment Status</p>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    order.paymentStatus === 'verified' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Total Paid</p>
                  <p className="text-xl font-black text-orange-600 tracking-tighter italic">৳{order.total.toLocaleString()}</p>
                </div>
              </div>
            </section>

            {/* 2. Items List */}
            <section className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic flex items-center">
                  <ShoppingBag className="w-6 h-6 mr-3 text-orange-600" />
                  Package Contents
                </h3>
                <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-4 py-2 rounded-full uppercase tracking-widest border border-gray-100">
                  {order.items.reduce((acc, item) => acc + item.quantity, 0)} Items
                </span>
              </div>

              <div className="space-y-6">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-gray-50/30 rounded-[2rem] border border-gray-50 hover:border-orange-100 transition-all group">
                    <div className="flex items-center space-x-6 mb-4 sm:mb-0">
                      <div className="relative flex-shrink-0">
                        <img 
                          src={item.imageUrls[0]} 
                          alt={item.name}
                          className="w-20 h-24 object-cover rounded-2xl shadow-md group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute -top-2 -right-2 bg-gray-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">
                          x{item.quantity}
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1 italic">{item.category}</p>
                        <h4 className="text-lg font-black text-gray-900 mb-1 leading-tight">{item.name}</h4>
                        {item.selectedVariant && (
                          <div className="flex items-center space-x-2">
                              <span className="w-2 h-2 rounded-full bg-orange-400" />
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type: {item.selectedVariant.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right flex sm:flex-col justify-between items-end">
                      <div className="sm:mb-2">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Line Total</p>
                        <p className="text-xl font-black text-gray-900 italic">৳{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                      <p className="text-[10px] font-bold text-gray-300 italic">Unit: ৳{item.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 pt-10 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    <span>Subtotal Sequence</span>
                    <span className="text-gray-900">৳{order.subtotal?.toLocaleString() || (order.total - order.deliveryCharge).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    <span>Logistics Fee</span>
                    <span className="text-gray-900">৳{order.deliveryCharge.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 italic leading-none">Settlement Amount</p>
                  <p className="text-5xl font-black text-gray-900 tracking-tighter italic leading-none">৳{order.total.toLocaleString()}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Customer & Shipping */}
          <div className="lg:col-span-4 space-y-8">
            {/* Shipping Destination */}
            <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 space-y-8">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-orange-600" />
                Delivery Area
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 shadow-inner">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-none">Recipient</p>
                    <p className="font-black text-gray-900 text-lg uppercase tracking-tight">{order.customerName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 shadow-inner">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-none">Secure Contact</p>
                    <p className="font-black text-gray-900 font-mono">{order.customerPhone}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4 italic">Geometric Location</p>
                  <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    <div className="space-y-2 text-sm font-black text-gray-700 italic tracking-tight uppercase">
                      <p className="border-b border-gray-200 pb-2">{order.address.street}</p>
                      <p className="border-b border-gray-200 py-2">{order.address.upazila}</p>
                      <p className="pt-2">{order.address.district}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Support Box */}
            <section className="bg-gray-900 p-10 rounded-[3rem] shadow-2xl shadow-gray-900/20 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:bg-orange-600/20" />
              <div className="relative z-10">
                <h4 className="text-xs font-black uppercase tracking-widest text-orange-600 mb-4">Secure Support</h4>
                <p className="text-gray-400 text-xs font-medium italic mb-8 leading-relaxed">
                  Need assistance with your package? Our logistics team is active 24/7.
                </p>
                <div className="space-y-3">
                  <button className="w-full py-4 bg-white/10 hover:bg-orange-600 transition-all rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] border border-white/5 shadow-xl">
                    Live Session
                  </button>
                  <button className="w-full py-4 bg-transparent hover:text-orange-500 transition-all font-black uppercase tracking-widest text-[10px]">
                    Report Anomaly
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
