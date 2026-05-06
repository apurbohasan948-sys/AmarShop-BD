import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import { Package, Clock, CheckCircle2, Truck, XCircle, Search, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'orders'),
          where('customerUid', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        
        // Manual sort to avoid composite index requirements
        fetchedOrders.sort((a: any, b: any) => {
          const t1 = a.createdAt?.seconds || new Date(a.createdAt).getTime();
          const t2 = b.createdAt?.seconds || new Date(b.createdAt).getTime();
          return t2 - t1;
        });

        setOrders(fetchedOrders);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-orange-500" />;
      case 'processing': return <Package className="w-5 h-5 text-blue-500" />;
      case 'shipped': return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const OrderStatusTracker = ({ status }: { status: string }) => {
    const steps = [
      { id: 'pending', label: 'Placed', icon: Clock },
      { id: 'processing', label: 'Processing', icon: Package },
      { id: 'shipped', label: 'Shipped', icon: Truck },
      { id: 'delivered', label: 'Delivered', icon: CheckCircle2 },
    ];

    if (status === 'cancelled') {
      return (
        <div className="mb-12 bg-red-50 p-8 rounded-[2.5rem] border border-red-100 flex items-center space-x-6">
          <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center shadow-lg shadow-red-500/10">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h4 className="text-sm font-black text-red-600 uppercase tracking-widest mb-1">Termination Sequence Active</h4>
            <p className="text-xs text-red-400 font-medium italic">This order has been cancelled and will not be processed further.</p>
          </div>
        </div>
      );
    }

    const currentStepIndex = steps.findIndex(s => s.id === status);
    
    return (
      <div className="mb-16 mt-8">
        <div className="relative px-4">
          {/* Progress Connector Background */}
          <div className="absolute top-7 left-0 w-full h-1.5 bg-gray-100 rounded-full" />
          
          {/* Glowing Active Connector */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            className="absolute top-7 left-0 h-1.5 bg-orange-600 rounded-full shadow-[0_0_15px_rgba(234,88,12,0.4)] transition-all duration-1000 ease-out"
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx <= currentStepIndex;
              const isActive = idx === currentStepIndex;

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
                      className={`w-14 h-14 rounded-2xl border-4 flex items-center justify-center transition-all duration-500 z-10 shadow-xl ${
                        isCompleted ? 'shadow-orange-500/20' : 'shadow-gray-200/5'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${isCompleted ? 'text-white' : 'text-gray-300'} ${isActive ? 'animate-pulse' : ''}`} />
                    </motion.div>
                    
                    {isActive && (
                      <div className="absolute -inset-2 bg-orange-600/10 rounded-3xl animate-ping -z-10" />
                    )}
                  </div>
                  
                  <div className="mt-6 text-center">
                    <p className={`text-[11px] font-black uppercase tracking-widest mb-1 transition-colors duration-500 ${isCompleted ? 'text-gray-900' : 'text-gray-300'}`}>
                      {step.label}
                    </p>
                    {isActive && (
                      <motion.span 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[8px] font-black text-orange-600 uppercase tracking-widest italic"
                      >
                        In Progress
                      </motion.span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-orange-600 animate-pulse">FETCHING YOUR ORDERS...</div>;

  return (
    <div className="bg-gray-50 min-h-screen py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter italic">Order History</h1>
          <p className="text-gray-400 font-medium italic mt-2">Tracking your style journey since day one</p>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order, i) => {
              const isExpanded = expandedOrderId === order.id;
              return (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Header - Clickable */}
                  <div 
                    onClick={() => order.id && toggleExpand(order.id)}
                    className="p-8 flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center space-x-6">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                        <Package className={`w-6 h-6 transition-colors ${isExpanded ? 'text-orange-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Order Ref</p>
                        <p className="font-mono text-xs font-bold text-gray-900">#{order.id?.slice(-8).toUpperCase()}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Placed On</p>
                      <p className="text-sm font-bold text-gray-900">{order.createdAt?.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Amount</p>
                      <p className="text-sm font-black text-orange-600 italic text-lg">৳{order.total.toLocaleString()}</p>
                    </div>
                    <div className={`px-6 py-2 rounded-full flex items-center space-x-2 border-2 ${
                      order.orderStatus === 'delivered' ? 'bg-green-50 border-green-100 text-green-700' : 
                      order.orderStatus === 'pending' ? 'bg-orange-50 border-orange-100 text-orange-700' :
                      'bg-gray-50 border-gray-100 text-gray-700'
                    }`}>
                      {getStatusIcon(order.orderStatus)}
                      <span className="text-xs font-black uppercase tracking-widest">{order.orderStatus}</span>
                    </div>
                  </div>

                  {/* Expandable Content */}
                  <motion.div
                    initial={false}
                    animate={{ height: isExpanded ? 'auto' : 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-8 bg-gray-50/50 border-t border-gray-50">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center">
                          <div className="w-2 h-2 rounded-full bg-orange-600 mr-2 animate-pulse" />
                          Visual Progress
                        </h3>
                        <Link 
                          to={`/order/${order.id}`}
                          className="flex items-center space-x-2 text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline group"
                        >
                          <span>See Full Tracker</span>
                          <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>
                      </div>
                      <OrderStatusTracker status={order.orderStatus} />
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Items Section */}
                        <div className="space-y-6">
                          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Ordered Items</h3>
                          <div className="space-y-4">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center space-x-4 bg-white p-4 rounded-2xl border border-gray-100/50">
                                <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0">
                                  <img src={item.imageUrls[0]} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-gray-900 line-clamp-1">
                                    {item.name}
                                    {item.selectedVariant && (
                                      <span className="ml-2 text-[10px] text-orange-600 font-black uppercase">({item.selectedVariant.name})</span>
                                    )}
                                  </p>
                                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Qty: {item.quantity} × ৳{item.price.toLocaleString()}</p>
                                </div>
                                <p className="text-sm font-black text-gray-900">৳{(item.price * item.quantity).toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-8">
                          {/* Shipping Info */}
                          <div className="bg-white p-6 rounded-[2rem] border border-gray-100/50 shadow-sm">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Shipping Details</h3>
                            <div className="space-y-2">
                              <p className="text-sm font-bold text-gray-900">{order.customerName}</p>
                              <p className="text-sm text-gray-500 font-medium italic">{order.customerPhone}</p>
                              <div className="pt-2 text-xs text-gray-500 font-medium leading-relaxed italic">
                                <p>{order.address.street}</p>
                                <p>{order.address.upazila}, {order.address.district}</p>
                                <p>Bangladesh</p>
                              </div>
                            </div>
                          </div>

                          {/* Payment & Summary */}
                          <div className="bg-white p-6 rounded-[2rem] border border-gray-100/50 shadow-sm">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Payment Info</h3>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400 font-medium italic">Status</span>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                  order.paymentStatus === 'verified' ? 'bg-green-50 text-green-600 border-green-100' : 
                                  order.paymentStatus === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                  'bg-orange-50 text-orange-600 border-orange-100'
                                }`}>
                                  {order.paymentStatus}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400 font-medium italic">Method</span>
                                <span className="text-gray-900 font-bold">{order.paymentMethod}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400 font-medium italic">Trx ID</span>
                                <span className="text-gray-900 font-mono text-xs font-bold">{order.transactionId}</span>
                              </div>
                              <div className="pt-4 border-t border-gray-50 space-y-2">
                                <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                  <span>Subtotal</span>
                                  <span>৳{order.subtotal?.toLocaleString() || (order.total - order.deliveryCharge).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                  <span>Delivery Fee</span>
                                  <span>৳{order.deliveryCharge.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-base font-black text-gray-900 pt-2">
                                  <span>Order Total</span>
                                  <span className="text-orange-600 tracking-tighter italic">৳{order.total.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[4rem] py-32 text-center border border-gray-100 shadow-sm">
            <div className="p-8 bg-gray-50 rounded-full inline-block mb-6">
              <Search className="w-12 h-12 text-gray-200" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">No orders yet</h3>
            <p className="text-gray-400 font-medium italic mt-2">Start your shopping journey today!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
