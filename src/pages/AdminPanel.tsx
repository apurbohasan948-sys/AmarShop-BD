import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Product, ProductVariant, Order, Category, StoreSettings } from '../types';
import { useStore } from '../contexts/StoreContext';
import { 
  Plus, Trash2, Edit3, Package, Database, Check, X, 
  Settings, ShoppingBag, Layers, BarChart3, ChevronRight, 
  Search, ExternalLink, Mail, Phone, MapPin, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'categories' | 'settings' | 'payments'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [verifiedTransactions, setVerifiedTransactions] = useState<any[]>([]);
  const { settings, updateSettings } = useStore();
  
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form States
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    imageUrl: '',
    stock: 10,
    isActive: true
  });
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantInput, setVariantInput] = useState({ name: '', price: 0, stock: 10 });
  const [categoryInput, setCategoryInput] = useState({ name: '', slug: '' });
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);
  const [txInput, setTxInput] = useState({ transactionId: '', amount: 0, method: 'bkash' });

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  useEffect(() => {
    const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    const unsubCats = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    const unsubTxs = onSnapshot(query(collection(db, 'verified_transactions'), orderBy('createdAt', 'desc')), (snap) => {
      setVerifiedTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubCats();
      unsubTxs();
    };
  }, []);

  // --- Actions ---
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...productForm,
        imageUrls: [productForm.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800'],
        variants: variants.length > 0 ? variants : null,
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), data);
      } else {
        await addDoc(collection(db, 'products'), {
          ...data,
          createdAt: new Date().toISOString()
        });
      }
      resetForm();
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryInput.name) return;
    await addDoc(collection(db, 'categories'), {
      ...categoryInput,
      slug: categoryInput.name.toLowerCase().replace(/\s+/g, '-')
    });
    setCategoryInput({ name: '', slug: '' });
  };

  const handleOrderStatusUpdate = async (orderId: string, status: Order['orderStatus']) => {
    await updateDoc(doc(db, 'orders', orderId), { orderStatus: status });
  };

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txInput.transactionId) return;
    await addDoc(collection(db, 'verified_transactions'), {
      ...txInput,
      isUsed: false,
      createdAt: new Date().toISOString()
    });
    setTxInput({ transactionId: '', amount: 0, method: 'bkash' });
  };

  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await updateSettings(settingsForm);
    setLoading(false);
    alert('Settings updated successfully!');
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setProductForm({ name: '', description: '', price: 0, category: categories[0]?.name || 'Uncategorized', imageUrl: '', stock: 10, isActive: true });
    setVariants([]);
  };

  const addVariant = () => {
    if (!variantInput.name) return;
    setVariants([...variants, { ...variantInput, id: Math.random().toString(36).substr(2, 9) }]);
    setVariantInput({ name: '', price: productForm.price || 0, stock: 10 });
  };

  const revenue = orders.filter(o => o.paymentStatus === 'verified').reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-6">
          <div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase mb-2">Master <span className="text-orange-600">Control</span></h1>
            <p className="text-gray-400 font-medium italic tracking-wide">Command center for {settings.storeName}</p>
          </div>
          
          <nav className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto max-w-full">
            {[
              { id: 'products', label: 'Inventory', icon: Package },
              { id: 'orders', label: 'Orders', icon: ShoppingBag },
              { id: 'categories', label: 'Categories', icon: Layers },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'payments', label: 'Ledger', icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-gray-900 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Net Revenue</p>
                <p className="text-2xl font-black text-gray-900">৳{revenue.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Orders</p>
                <p className="text-2xl font-black text-gray-900">{orders.length}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Live Stock</p>
                <p className="text-2xl font-black text-gray-900">{products.reduce((acc, p) => acc + p.stock, 0)}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 group hover:bg-orange-600 transition-all cursor-pointer">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1 group-hover:text-white/50">Pending Flow</p>
                <p className="text-2xl font-black text-gray-900 group-hover:text-white">{orders.filter(o => o.orderStatus === 'pending').length}</p>
            </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* --- PRODUCTS TAB --- */}
            {activeTab === 'products' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-gray-900">Product Management</h2>
                  <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add New Piece</span>
                  </button>
                </div>

                {showAddForm && (
                  <form onSubmit={handleProductSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                      <div className="space-y-6">
                        <div>
                          <label className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-2 block">Name</label>
                          <input required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-600/20" />
                        </div>
                        <div>
                          <label className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-2 block">Price (BDT)</label>
                          <input type="number" required value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-600/20" />
                        </div>
                        <div>
                          <label className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-2 block">Category</label>
                          <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-600/20">
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <label className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-2 block">Image URL</label>
                          <input value={productForm.imageUrl} onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-600/20" placeholder="https://..." />
                        </div>
                        <div>
                          <label className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-2 block">Base Stock</label>
                          <input type="number" required value={productForm.stock} onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-600/20" />
                        </div>
                        <div>
                          <label className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-2 block">Description</label>
                          <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-600/20 h-[116px]" />
                        </div>
                      </div>

                      {/* Variants */}
                      <div className="md:col-span-2 bg-gray-50/50 p-6 rounded-3xl space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-gray-900 font-black uppercase tracking-tighter text-xs">Product Variants (Optional)</label>
                          <span className="text-[10px] text-gray-400 font-bold italic">Note: If variants exist, their individual stock & price will take precedence.</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <input placeholder="Label (e.g. XL or Red)" value={variantInput.name} onChange={e => setVariantInput({...variantInput, name: e.target.value})} className="px-4 py-3 bg-white rounded-xl border-none shadow-sm font-bold" />
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 font-bold">৳</span>
                            <input type="number" placeholder="Price" value={variantInput.price} onChange={e => setVariantInput({...variantInput, price: Number(e.target.value)})} className="w-full pl-8 pr-4 py-3 bg-white rounded-xl border-none shadow-sm font-bold" />
                          </div>
                          <input type="number" placeholder="Stock" value={variantInput.stock} onChange={e => setVariantInput({...variantInput, stock: Number(e.target.value)})} className="px-4 py-3 bg-white rounded-xl border-none shadow-sm font-bold" />
                          <button type="button" onClick={addVariant} className="bg-gray-900 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 transition-all">Add Variant</button>
                        </div>
                        
                        {variants.length > 0 && (
                          <div className="flex flex-wrap gap-3 pt-2">
                            {variants.map(v => (
                              <div key={v.id} className="bg-white px-4 py-2 rounded-2xl border border-gray-100 flex items-center space-x-4 shadow-sm group">
                                <div className="space-y-0.5">
                                  <p className="text-xs font-black text-gray-900 uppercase tracking-tight leading-none">{v.name}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                                    <span>৳{v.price}</span>
                                    <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                    <span>{v.stock} Stock</span>
                                  </p>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setVariants(variants.filter(x => x.id !== v.id))} 
                                  className="text-gray-200 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end space-x-4">
                      <button type="button" onClick={resetForm} className="px-6 font-bold text-gray-400">Discard</button>
                      <button type="submit" className="bg-gray-900 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-all">
                        {editingId ? 'Push Update' : 'Initialize Post'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Asset</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Category</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Valuation</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Availability</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50/30 transition-all group">
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-5">
                              <img src={p.imageUrls[0]} className="w-14 h-14 rounded-2xl object-cover bg-gray-100 shadow-sm" />
                              <span className="font-black text-gray-900 text-lg tracking-tight uppercase">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 uppercase text-[10px] font-black text-gray-400">[{p.category}]</td>
                          <td className="px-8 py-6 font-mono font-bold text-gray-900 italic underline decoration-orange-600/30 decoration-2">৳{p.price.toLocaleString()}</td>
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${p.stock > 10 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                              <span className="text-sm font-bold text-gray-500">{p.stock} units</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => {
                                setEditingId(p.id);
                                setProductForm({
                                  name: p.name,
                                  description: p.description,
                                  price: p.price,
                                  category: p.category,
                                  imageUrl: p.imageUrls[0],
                                  stock: p.stock,
                                  isActive: p.isActive
                                });
                                setVariants(p.variants || []);
                                setShowAddForm(true);
                              }} className="p-3 bg-gray-50 hover:bg-gray-900 hover:text-white rounded-xl transition-all shadow-sm">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={async () => {
                                if(confirm('Purge this asset from inventory?')) await deleteDoc(doc(db, 'products', p.id));
                              }} className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- ORDERS TAB --- */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction / Customer</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Items</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Financials</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Flow State</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50/30 transition-all">
                        <td className="px-8 py-6">
                          <div className="font-mono text-xs text-orange-600 mb-1">#{o.transactionId}</div>
                          <div className="font-black text-gray-900 uppercase tracking-tighter">{o.customerName}</div>
                          <div className="text-[10px] text-gray-400 font-bold">{o.customerPhone}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex -space-x-3">
                            {o.items.slice(0, 3).map((item, idx) => (
                              <img key={idx} src={item.imageUrls[0]} className="w-10 h-10 rounded-full border-4 border-white shadow-sm object-cover" />
                            ))}
                            {o.items.length > 3 && (
                                <div className="w-10 h-10 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">+{o.items.length - 3}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-black text-gray-900 tracking-tight">৳{o.total.toLocaleString()}</div>
                          <div className={`text-[10px] font-black uppercase tracking-widest ${o.paymentStatus === 'verified' ? 'text-green-600' : 'text-orange-400'}`}>[{o.paymentMethod}: {o.paymentStatus}]</div>
                        </td>
                        <td className="px-8 py-6">
                           <select 
                            value={o.orderStatus}
                            onChange={(e) => handleOrderStatusUpdate(o.id!, e.target.value as any)}
                            className="bg-gray-50 border-none rounded-xl text-xs font-black uppercase tracking-widest px-4 py-2 focus:ring-0 cursor-pointer hover:bg-gray-100 transition-all"
                           >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                           </select>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button 
                            onClick={async () => {
                              if(confirm('Verify payment for this order?')) {
                                await updateDoc(doc(db, 'orders', o.id!), { paymentStatus: 'verified' });
                              }
                            }}
                            className="p-3 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all shadow-sm"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- CATEGORIES TAB --- */}
            {activeTab === 'categories' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-1">
                  <h2 className="text-2xl font-black text-gray-900 mb-6">Namespace Definition</h2>
                  <form onSubmit={handleCategorySubmit} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
                    <div>
                      <label className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-2 block">Category Title</label>
                      <input 
                        value={categoryInput.name}
                        onChange={e => setCategoryInput({...categoryInput, name: e.target.value})}
                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-600/20"
                        placeholder="e.g. Sneakers"
                      />
                    </div>
                    <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-all">
                      Add to Registry
                    </button>
                  </form>
                </div>
                <div className="md:col-span-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {categories.map(c => (
                      <div key={c.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex justify-between items-center group hover:bg-orange-600 transition-all shadow-sm">
                        <span className="font-black uppercase tracking-tighter text-gray-900 group-hover:text-white">{c.name}</span>
                        <button 
                          onClick={async () => {
                            if(confirm('Delete category?')) await deleteDoc(doc(db, 'categories', c.id));
                          }}
                          className="text-gray-200 hover:text-white group-hover:text-white/50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- SETTINGS TAB --- */}
            {activeTab === 'settings' && (
              <form onSubmit={handleSettingsUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-1">
                  <div className="bg-gray-900 p-10 rounded-[3rem] text-white space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600 rounded-full blur-[100px] -mr-16 -mt-16 opacity-50" />
                    <h2 className="text-3xl font-black tracking-tighter uppercase relative z-10 leading-none">Core <br /> <span className="text-orange-500">Identity</span></h2>
                    <p className="text-gray-400 text-sm font-medium italic">Define how AmarShop projects its value to the digital ecosystem.</p>
                    
                    <div className="space-y-4 pt-6">
                      <div className="flex items-center space-x-4 group cursor-pointer border-b border-white/5 pb-4">
                        <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-orange-600 transition-all"><Mail className="w-5 h-5" /></div>
                        <span className="font-mono text-xs opacity-50">{settingsForm.email}</span>
                      </div>
                      <div className="flex items-center space-x-4 group cursor-pointer border-b border-white/5 pb-4">
                        <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-orange-600 transition-all"><Phone className="w-5 h-5" /></div>
                        <span className="font-mono text-xs opacity-50">{settingsForm.phone}</span>
                      </div>
                      <div className="flex items-center space-x-4 group cursor-pointer border-b border-white/5 pb-4">
                        <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-orange-600 transition-all"><MapPin className="w-5 h-5" /></div>
                        <span className="font-mono text-xs opacity-50 truncate max-w-[150px]">{settingsForm.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100 space-y-10">
                   {/* Visual settings */}
                   <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center space-x-3">
                      <div className="w-10 h-[1px] bg-gray-200" />
                      <span>General Configuration</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-900 ml-2">Store Master Name</label>
                        <input value={settingsForm.storeName} onChange={e => setSettingsForm({...settingsForm, storeName: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-900 ml-2">Display Email</label>
                        <input value={settingsForm.email} onChange={e => setSettingsForm({...settingsForm, email: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-900 ml-2">Contact Phone</label>
                        <input value={settingsForm.phone} onChange={e => setSettingsForm({...settingsForm, phone: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-900 ml-2">HQ Address</label>
                        <input value={settingsForm.address} onChange={e => setSettingsForm({...settingsForm, address: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold" />
                      </div>
                    </div>
                   </div>

                   {/* Pricing settings */}
                   <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center space-x-3">
                      <div className="w-10 h-[1px] bg-gray-200" />
                      <span>Logistics & Payments</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-900 ml-2">inside Dhaka Charge</label>
                        <input type="number" value={settingsForm.deliveryChargeInsideDhaka} onChange={e => setSettingsForm({...settingsForm, deliveryChargeInsideDhaka: Number(e.target.value)})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-900 ml-2">Outside Dhaka Charge</label>
                        <input type="number" value={settingsForm.deliveryChargeOutsideDhaka} onChange={e => setSettingsForm({...settingsForm, deliveryChargeOutsideDhaka: Number(e.target.value)})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-900 ml-2 flex items-center space-x-2">
                          <CreditCard className="w-3 h-3 text-orange-600" />
                          <span>bKash Personal</span>
                        </label>
                        <input value={settingsForm.bkashNumber} onChange={e => setSettingsForm({...settingsForm, bkashNumber: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold font-mono" placeholder="01XXX..." />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-900 ml-2 flex items-center space-x-2">
                          <CreditCard className="w-3 h-3 text-red-600" />
                          <span>Nagad Personal</span>
                        </label>
                        <input value={settingsForm.nagadNumber} onChange={e => setSettingsForm({...settingsForm, nagadNumber: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold font-mono" placeholder="01XXX..." />
                      </div>
                    </div>
                   </div>

                   {/* Social settings */}
                   <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center space-x-3">
                      <div className="w-10 h-[1px] bg-gray-200" />
                      <span>Social Connectivity</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-900 ml-2">Facebook URL</label>
                        <input value={settingsForm.facebookUrl} onChange={e => setSettingsForm({...settingsForm, facebookUrl: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold" placeholder="https://..." />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-900 ml-2">Instagram URL</label>
                        <input value={settingsForm.instagramUrl} onChange={e => setSettingsForm({...settingsForm, instagramUrl: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold" placeholder="https://..." />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-black text-gray-900 ml-2">WhatsApp Number (Support)</label>
                        <input value={settingsForm.whatsappNumber} onChange={e => setSettingsForm({...settingsForm, whatsappNumber: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold" placeholder="e.g. 01XXXXXXXXX" />
                      </div>
                    </div>
                   </div>

                   {/* Banner settings */}
                   <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center space-x-3">
                      <div className="w-10 h-[1px] bg-gray-200" />
                      <span>Promotion & Visuals</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-black text-gray-900 ml-2">Hero Banner Image URL</label>
                        <input value={settingsForm.heroBannerUrl} onChange={e => setSettingsForm({...settingsForm, heroBannerUrl: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-900 ml-2">Banner Title</label>
                        <input value={settingsForm.heroBannerTitle} onChange={e => setSettingsForm({...settingsForm, heroBannerTitle: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-900 ml-2">Banner Subtitle</label>
                        <input value={settingsForm.heroBannerSubtitle} onChange={e => setSettingsForm({...settingsForm, heroBannerSubtitle: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold" />
                      </div>
                    </div>
                   </div>

                   <div className="pt-6 border-t border-gray-100 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-orange-600 text-white px-16 py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {loading ? 'Committing...' : 'Save Global Blueprint'}
                      </button>
                   </div>
                </div>
              </form>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-8">
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm">
                  <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase mb-2">Verified <span className="text-orange-600">Ledger</span></h2>
                  <p className="text-gray-400 font-medium italic mb-10">Add legitimate transaction IDs to the system for instant customer checkout verification.</p>
                  
                  <form onSubmit={handleTxSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Transaction ID</label>
                       <input 
                         placeholder="e.g. A1B2C3" 
                         value={txInput.transactionId} 
                         onChange={e => setTxInput({...txInput, transactionId: e.target.value})} 
                         className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold uppercase" 
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Verified Amount</label>
                       <input 
                         type="number" 
                         placeholder="৳ 0.00" 
                         value={txInput.amount || ''} 
                         onChange={e => setTxInput({...txInput, amount: Number(e.target.value)})} 
                         className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold" 
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Platform</label>
                       <select 
                         value={txInput.method} 
                         onChange={e => setTxInput({...txInput, method: e.target.value})} 
                         className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none font-bold appearance-none"
                       >
                         <option value="bkash">bKash</option>
                         <option value="nagad">Nagad</option>
                       </select>
                    </div>
                    <div className="flex items-end">
                       <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 transition-all shadow-lg active:scale-95 h-[56px]">Authorize ID</button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction ID</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Platform</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Amount</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {verifiedTransactions.map(tx => (
                        <tr key={tx.id} className="group hover:bg-gray-50/30 transition-all">
                          <td className="px-10 py-6 font-black text-gray-900 uppercase tracking-tight text-lg">{tx.transactionId}</td>
                          <td className="px-10 py-6 uppercase text-[10px] font-black text-gray-400">[{tx.method}]</td>
                          <td className="px-10 py-6 font-bold text-gray-900 italic underline decoration-orange-600/20 decoration-2">৳{tx.amount.toLocaleString()}</td>
                          <td className="px-10 py-6">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${tx.isUsed ? 'bg-gray-100 text-gray-300' : 'bg-green-50 text-green-600 animate-pulse'}`}>
                              {tx.isUsed ? 'Consumed' : 'Active / Valid'}
                            </span>
                          </td>
                          <td className="px-10 py-6 text-right">
                            <button onClick={async () => {
                              if(confirm('Purge this record?')) await deleteDoc(doc(db, 'verified_transactions', tx.id));
                            }} className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {verifiedTransactions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-10 py-20 text-center text-gray-400 font-bold italic">No verified transactions in the ledger.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminPanel;
