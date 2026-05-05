import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { User, Mail, Phone, MapPin, Calendar, ShieldCheck, LogOut, Camera, ShoppingBag, ChevronRight, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Order } from '../types';

const ProfilePage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [orderStats, setOrderStats] = useState({ count: 0, recent: [] as Order[] });
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }

    const fetchOrderStats = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'orders'),
          where('customerUid', '==', user.uid)
        );
        const snap = await getDocs(q);
        const allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        
        // Manual sort to avoid index requirement
        allOrders.sort((a: any, b: any) => {
          const t1 = a.createdAt?.seconds || new Date(a.createdAt).getTime();
          const t2 = b.createdAt?.seconds || new Date(b.createdAt).getTime();
          return t2 - t1;
        });

        setOrderStats({
          count: allOrders.length,
          recent: allOrders.slice(0, 3)
        });
      } catch (err) {
        console.error('Error fetching order stats:', err);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrderStats();
  }, [profile, user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: new Date().toISOString(),
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-2">My <span className="text-orange-600">Account</span></h1>
            <p className="text-gray-400 font-medium italic">Manage your digital identity and preferences</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-white text-red-500 px-6 py-3 rounded-2xl font-bold border border-red-50 hover:bg-red-50 transition-all active:scale-95 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar / Identity Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-orange-600" />
                  )}
                </div>
                <button className="absolute bottom-1 right-1 bg-gray-900 p-2.5 rounded-full text-white hover:bg-orange-600 transition-all shadow-lg border-2 border-white">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none mb-1">{profile.fullName || 'Anonymous'}</h2>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">[{profile.role}]</p>
              
              <div className="w-full pt-6 border-t border-gray-50 flex justify-center space-x-8">
                <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Orders</p>
                    <p className="text-lg font-black text-gray-900 italic underline decoration-orange-500 decoration-4">{ordersLoading ? '...' : orderStats.count}</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Status</p>
                    <p className="text-lg font-black text-orange-600 italic">{orderStats.count >= 5 ? 'VIP' : 'Silver'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-50 mb-4">Security Overview</h3>
              <div className="flex items-center space-x-4">
                <div className="bg-white/5 p-2 rounded-xl"><ShieldCheck className="w-5 h-5 text-green-400" /></div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Verification</p>
                  <p className="text-xs font-bold">{user.emailVerified ? 'E-Mail Verified' : 'Pending Verification'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-white/5 p-2 rounded-xl"><Calendar className="w-5 h-5 text-orange-400" /></div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Member Since</p>
                  <p className="text-xs font-bold">{new Date(profile.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic underline decoration-orange-500 decoration-2">Identity Details</h3>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-black uppercase tracking-widest text-orange-600 hover:scale-105 transition-all"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                      <input 
                        value={formData.fullName}
                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone String</label>
                      <input 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold text-sm"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Physical Address</label>
                      <textarea 
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold text-sm h-32"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-6 font-bold text-gray-400 text-sm">Discard</button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Save Meta Data'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="flex items-start space-x-4">
                      <Mail className="w-5 h-5 text-gray-300 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Email Access</p>
                        <p className="font-bold text-gray-900">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Phone className="w-5 h-5 text-gray-300 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Contact Number</p>
                        <p className="font-bold text-gray-900">{profile.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="md:col-span-2 flex items-start space-x-4 border-t border-gray-50 pt-8">
                      <MapPin className="w-5 h-5 text-gray-300 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Delivery Endpoint</p>
                        <p className="font-bold text-gray-900 leading-relaxed">{profile.address || 'No delivery address saved yet.'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-10">
                    <button className="w-full p-6 bg-orange-50 rounded-[2rem] border border-orange-100 group hover:bg-orange-600 transition-all">
                      <p className="text-left font-black text-orange-600 group-hover:text-white uppercase tracking-tighter text-lg leading-none">Voucher Registry</p>
                      <p className="text-left text-[10px] font-bold text-orange-400 group-hover:text-white/70 italic mt-1 uppercase tracking-widest">You have 3 active coupons</p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic underline decoration-orange-500 decoration-2">Order History</h3>
                <Link 
                  to="/orders"
                  className="text-xs font-black uppercase tracking-widest text-orange-600 hover:scale-105 transition-all flex items-center"
                >
                  See All Orders
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {ordersLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orderStats.recent.length > 0 ? (
                <div className="space-y-4">
                  {orderStats.recent.map((order) => (
                    <Link 
                      key={order.id} 
                      to="/orders" 
                      className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl hover:bg-orange-50 transition-all border border-transparent hover:border-orange-100 group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-orange-500 transition-colors">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Ref</p>
                          <p className="text-sm font-bold text-gray-900">#{order.id?.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                      
                      <div className="hidden md:block">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Placed On</p>
                        <p className="text-xs font-bold text-gray-900">
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Recent'}
                        </p>
                      </div>

                      <div className="text-right flex items-center space-x-6">
                        <div className="hidden sm:block">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</p>
                           <p className="text-sm font-black text-orange-600 italic">৳{order.total.toLocaleString()}</p>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' : 
                          order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {order.orderStatus}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                  <Clock className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold italic">No orders found in registry</p>
                  <Link to="/" className="text-xs font-black text-orange-600 uppercase tracking-widest mt-4 inline-block hover:underline">Start Shopping</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
