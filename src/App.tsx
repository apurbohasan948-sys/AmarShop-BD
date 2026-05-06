import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { StoreProvider, useStore } from './contexts/StoreContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import AuthPage from './pages/AuthPage';
import CheckoutPage from './pages/CheckoutPage';
// Placeholder pages to be implemented if not finished in this turn
import ShopPage from './pages/ShopPage';
import ProductDetails from './pages/ProductDetails';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import OrderDetails from './pages/OrderDetails';
import ChatWidget from './components/ChatWidget';
import { MessageCircle } from 'lucide-react';

import { StoreSettings } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;

  return <>{children}</>;
};

const Layout = ({ children, settings }: { children: React.ReactNode, settings: StoreSettings }) => (
  <div className="min-h-screen flex flex-col font-sans pb-24 md:pb-0">
    <Navbar />
    <main className="flex-1">{children}</main>
    <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <h3 className="text-white font-black text-2xl tracking-tighter border-b-2 border-orange-600 inline-block">{settings.storeName}</h3>
          <p className="text-gray-400 text-sm font-medium italic">{settings.address}</p>
          <div className="text-gray-500 text-xs font-mono">
            {settings.email} <br />
            {settings.phone}
          </div>
        </div>
        <div>
          <h4 className="text-white font-black text-sm uppercase tracking-widest mb-6">Quick Links</h4>
          <ul className="space-y-2 text-gray-400 text-sm font-medium italic">
            <li><a href="#" className="hover:text-orange-500 transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-orange-500 transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-orange-500 transition-colors">Return Policy</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-black text-sm uppercase tracking-widest mb-6">Customer Care</h4>
          <ul className="space-y-2 text-gray-400 text-sm font-medium italic">
            <li><a href="#" className="hover:text-orange-500 transition-colors">Help Center</a></li>
            <li><a href="#" className="hover:text-orange-500 transition-colors">How to Buy</a></li>
            <li><a href="#" className="hover:text-orange-500 transition-colors">Contact Us</a></li>
            <li><a href="#" className="hover:text-orange-500 transition-colors">Shipping & Delivery</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-black text-sm uppercase tracking-widest mb-6">Follow Us</h4>
          <div className="flex space-x-4">
             {settings.facebookUrl && (
               <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 hover:bg-orange-600 hover:border-orange-600 transition-all flex items-center justify-center text-white">FB</a>
             )}
             {settings.instagramUrl && (
               <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 hover:bg-orange-600 hover:border-orange-600 transition-all flex items-center justify-center text-white">IG</a>
             )}
             <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 hover:bg-orange-600 hover:border-orange-600 transition-all cursor-pointer flex items-center justify-center text-white">TW</div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest italic">© 2026 {settings.storeName}. All Rights Reserved.</p>
        <div className="flex space-x-4 mt-4 md:mt-0 opacity-50 grayscale transition-all hover:grayscale-0">
          <img src="https://img.icons8.com/color/48/000000/visa.png" alt="Visa" className="h-6" />
          <img src="https://img.icons8.com/color/48/000000/mastercard.png" alt="Mastercard" className="h-6" />
          <img src="https://img.icons8.com/color/48/000000/google-pay.png" alt="GPay" className="h-6" />
        </div>
      </div>
    </footer>
    {settings.liveChatType === 'built-in' ? (
      <ChatWidget />
    ) : (
      settings.whatsappNumber && (
        <a 
          href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '').startsWith('88') ? '' : '88'}${settings.whatsappNumber.replace(/\D/g, '')}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-28 md:bottom-10 right-6 z-40 bg-green-500 text-white p-4 rounded-full shadow-2xl shadow-green-500/20 hover:bg-green-600 transition-all hover:scale-110 active:scale-95 group"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
            Chat Support
          </span>
        </a>
      )
    )}
  </div>
);

export default function App() {
  return (
    <Router>
      <StoreProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppContent />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </StoreProvider>
    </Router>
  );
}

const AppContent = () => {
  const { settings, loading } = useStore();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Layout settings={settings}>
      <Routes>
        <Route path="/" element={<ShopPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/shop" element={<Navigate to="/" replace />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={
          <ProtectedRoute>
            <WishlistPage />
          </ProtectedRoute>
        } />
        
        <Route path="/checkout" element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        } />
        
        <Route path="/orders" element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        } />
        
        <Route path="/order/:id" element={
          <ProtectedRoute>
            <OrderDetails />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />

        <Route path="/track" element={<OrderTrackingPage />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
