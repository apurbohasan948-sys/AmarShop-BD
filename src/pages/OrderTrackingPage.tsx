import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Order } from '../types';
import { Search, Package, Truck, CheckCircle2, Clock, MapPin, Phone, User, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const OrderTrackingPage = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const orderRef = doc(db, 'orders', orderId);
      const snap = await getDoc(orderRef);
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() } as Order);
      } else {
        setError('Order ID not found. Please check and try again.');
      }
    } catch (err) {
      setError('An error occurred during tracking.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'processing', 'shipped', 'delivered'];
    return steps.indexOf(status);
  };

  const steps = [
    { id: 'pending', label: 'Placed', icon: Clock },
    { id: 'processing', label: 'Processing', icon: Package },
    { id: 'shipped', label: 'Shipped', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];

  const statusIcons = {
    pending: <Clock className="w-6 h-6" />,
    processing: <Package className="w-6 h-6" />,
    shipped: <Truck className="w-6 h-6" />,
    delivered: <CheckCircle2 className="w-6 h-6" />,
    cancelled: <ShoppingBag className="w-6 h-6" />
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 md:py-20">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter uppercase mb-4">
            Track Your <span className="text-orange-600 italic">Package</span>
          </h1>
          <p className="text-gray-400 font-medium italic tracking-wide">Enter your unique order identifier to see real-time updates</p>
        </header>

        <form onSubmit={handleTrack} className="mb-12 relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="w-6 h-6 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="e.g. ORDER-77B2X9-BD"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full bg-white pl-16 pr-44 py-6 rounded-[2.5rem] shadow-xl shadow-orange-500/5 border border-gray-100 font-black text-lg uppercase tracking-tight focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-3 bottom-3 bg-gray-900 text-white px-10 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track Now'}
          </button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 text-red-500 p-6 rounded-3xl border border-red-100 text-center font-bold italic"
            >
              {error}
            </motion.div>
          )}

          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Status Visualizer */}
              <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100">
                <div className="relative mb-16 mt-8">
                  {/* Progress Line Background */}
                  <div className="absolute top-8 left-0 w-full h-1.5 bg-gray-100 rounded-full" />
                  
                  {/* Active Progress Line */}
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(getStatusStep(order.orderStatus) / (steps.length - 1)) * 100}%` }}
                    className="absolute top-8 left-0 h-1.5 bg-orange-600 rounded-full shadow-[0_0_15px_rgba(234,88,12,0.4)] transition-all duration-1000 ease-out z-0"
                  />

                  <div className="relative flex justify-between items-center z-10 px-2">
                    {steps.map((step, idx) => {
                      const currentStepIndex = getStatusStep(order.orderStatus);
                      const isCompleted = idx <= currentStepIndex;
                      const isActive = idx === currentStepIndex;
                      const Icon = step.icon;

                      return (
                        <div key={step.id} className="flex flex-col items-center">
                          <div className="relative group">
                            <motion.div 
                              initial={false}
                              animate={{ 
                                scale: isActive ? 1.25 : 1,
                                backgroundColor: isCompleted ? '#ea580c' : '#ffffff',
                                borderColor: isCompleted ? '#ea580c' : '#f3f4f6'
                              }}
                              className={`w-16 h-16 rounded-[1.5rem] border-4 flex items-center justify-center transition-all duration-500 shadow-xl ${
                                isCompleted ? 'shadow-orange-500/20' : 'shadow-gray-200/5'
                              }`}
                            >
                              <Icon className={`w-7 h-7 ${isCompleted ? 'text-white' : 'text-gray-300'} ${isActive ? 'animate-pulse' : ''}`} />
                            </motion.div>
                            
                            {isActive && (
                              <div className="absolute -inset-2 bg-orange-600/10 rounded-[2rem] animate-ping -z-10" />
                            )}
                            
                            {isCompleted && !isActive && (
                              <div className="absolute -top-2 -right-2 bg-green-500 rounded-xl p-1.5 border-4 border-white shadow-lg">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-8 text-center">
                            <h4 className={`text-xs font-black uppercase tracking-widest mb-1 transition-colors duration-500 ${isCompleted ? 'text-gray-900' : 'text-gray-300'}`}>
                              {step.label}
                            </h4>
                            {isActive && (
                              <motion.p 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[9px] font-black text-orange-600 uppercase tracking-widest italic"
                              >
                                Current Phase
                              </motion.p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between gap-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Order Identity</p>
                    <p className="text-xl font-black text-gray-900 uppercase"># {orderId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Payment Status</p>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                      order.paymentStatus === 'verified' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 space-y-6">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Recipient Info</h3>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400"><User className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Customer Name</p>
                      <p className="font-black text-gray-900">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400"><Phone className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Phone Line</p>
                      <p className="font-black text-gray-900">{order.customerPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mt-1"><MapPin className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Drop Point</p>
                      <p className="font-black text-gray-900 text-sm">{order.address.street}, {order.address.upazila}, {order.address.district}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 text-white p-10 rounded-[3rem] shadow-xl shadow-gray-900/10 space-y-6">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Order Summary</h3>
                  <div className="space-y-4 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                        <div className="flex items-center space-x-4">
                          <span className="text-[10px] font-black bg-orange-600 px-2 py-1 rounded-lg">x{item.quantity}</span>
                          <div>
                            <p className="text-xs font-bold truncate max-w-[150px]">{item.name}</p>
                            {item.selectedVariant && <p className="text-[10px] opacity-50 uppercase">{item.selectedVariant.name}</p>}
                          </div>
                        </div>
                        <p className="font-black text-sm italic">৳{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 italic">Total Amount</p>
                    <p className="text-3xl font-black text-orange-500 italic">৳{order.total.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Items List Detail */}
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic underline decoration-orange-500 decoration-2">Package Contents</h3>
                  <div className="px-4 py-2 bg-gray-50 rounded-full border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                  </div>
                </div>

                <div className="space-y-6">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-transparent hover:border-orange-100 transition-all group">
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <img 
                            src={item.imageUrls[0]} 
                            alt={item.name}
                            className="w-20 h-24 object-cover rounded-2xl shadow-md group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute -top-2 -right-2 bg-gray-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                            {item.quantity}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 italic">{item.category}</p>
                          <h4 className="text-lg font-black text-gray-900 mb-1 leading-tight">{item.name}</h4>
                          {item.selectedVariant && (
                            <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full bg-orange-400" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Variant: {item.selectedVariant.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Unit Price</p>
                        <p className="text-lg font-black text-gray-900 italic">৳{item.price.toLocaleString()}</p>
                        <div className="mt-2 text-[10px] font-bold text-gray-400">
                          Total: ৳{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 pt-10 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Cart Subtotal</p>
                    <p className="text-lg font-black text-gray-900 italic">৳{order.subtotal?.toLocaleString() || (order.total - order.deliveryCharge).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Delivery Fee</p>
                    <p className="text-lg font-black text-gray-900 italic">৳{order.deliveryCharge.toLocaleString()}</p>
                  </div>
                  <div className="md:col-span-2 text-right flex flex-col justify-end">
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 italic">Grand Total Paid</p>
                    <p className="text-4xl font-black text-gray-900 tracking-tighter italic">৳{order.total.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
