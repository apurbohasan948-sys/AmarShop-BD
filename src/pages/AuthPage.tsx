import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { Store, Chrome, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      let message = 'Failed to sign in. Please try again.';
      if (err.code === 'auth/popup-blocked') {
        message = 'Login popup was blocked. Please allow popups for this site.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'Google Login is not enabled in Firebase Console.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        if (formData.name) {
          await updateProfile(userCredential.user, { displayName: formData.name });
        }
      }
      navigate('/');
    } catch (err: any) {
      const message = err.code === 'auth/email-already-in-use' 
        ? 'This email is already registered.' 
        : err.code === 'auth/weak-password'
        ? 'Password should be at least 6 characters.'
        : err.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : err.code === 'auth/operation-not-allowed'
        ? 'Email/Password login is not enabled in Firebase Console.'
        : err.message;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 bg-gray-50/50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-8 md:p-12 rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="p-4 bg-orange-50 rounded-3xl mb-6">
            <Store className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter text-center">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-400 font-medium italic text-center mt-2 max-w-[240px]">
            {isLogin ? 'Sign in to continue your shopping journey.' : 'Join the community for exclusive perks.'}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }}
            className="w-full p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold mb-6 text-center border border-red-100"
          >
            {error}
          </motion.div>
        )}

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4 mb-8">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <UserIcon className="absolute left-4 top-4.5 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-600/20 font-medium transition-all"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-4.5 w-4.5 h-4.5 text-gray-400" />
            <input
              type="email"
              required
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-600/20 font-medium transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4.5 w-4.5 h-4.5 text-gray-400" />
            <input
              type="password"
              required
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-600/20 font-medium transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-gray-900/20 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-gray-400">
            <span className="bg-white px-4">OR CONTINUE WITH</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-gray-100 py-4 rounded-2xl hover:border-gray-900 transition-all active:scale-95 group mb-6"
        >
          <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-gray-900 transition-all">
            <Chrome className="w-5 h-5 text-gray-600 group-hover:text-white" />
          </div>
          <span className="font-black text-gray-900 tracking-tight">Google</span>
        </button>

        <div className="text-center">
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-gray-400 hover:text-orange-600 transition-colors italic"
          >
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>
        
        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest text-center mt-8">
          Secured by Firebase Authentication
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
