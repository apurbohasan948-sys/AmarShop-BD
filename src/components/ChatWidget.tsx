import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, User, Headset } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessage } from '../types';

const ChatWidget = () => {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !isOpen) return;

    const chatRef = collection(db, 'chats', user.uid, 'messages');
    const q = query(chatRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
      
      // Mark as read when open (if last message is from admin)
      if (snap.docs.length > 0) {
        updateDoc(doc(db, 'chats', user.uid), { unreadCount: 0 }).catch(() => {});
      }
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    const text = message;
    setMessage('');
    setLoading(true);

    try {
      const chatDoc = doc(db, 'chats', user.uid);
      const msgData = {
        senderId: user.uid,
        senderRole: 'customer',
        text,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(chatDoc, 'messages'), msgData);
      
      await setDoc(chatDoc, {
        customerId: user.uid,
        customerName: profile?.fullName || user.displayName || 'Anonymous',
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        unreadCount: increment(0) // Admin will handle unread
      }, { merge: true });

    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-28 md:bottom-10 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[350px] h-[500px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gray-900 p-6 flex justify-between items-center">
              <div className="flex items-center space-x-3 text-white">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                  <Headset className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest">Support Core</h3>
                  <p className="text-[10px] text-orange-400 font-bold animate-pulse uppercase tracking-widest">Online Agent Ready</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-6">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-200">
                    <MessageCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase">Initialize Stream</h4>
                    <p className="text-[10px] text-gray-400 font-medium italic mt-1">Hello! How can we assist you today? Our average response time is under 5 minutes.</p>
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex ${msg.senderRole === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium ${
                    msg.senderRole === 'customer' 
                      ? 'bg-gray-900 text-white rounded-br-none' 
                      : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center space-x-2">
              <input 
                type="text"
                placeholder="Type your transmission..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 px-5 py-3 bg-gray-50 rounded-xl border-none focus:ring-1 focus:ring-orange-600/20 text-xs font-bold"
              />
              <button 
                type="submit"
                disabled={!message.trim() || loading}
                className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20 disabled:opacity-50 hover:bg-orange-700 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-900 text-white p-4 rounded-full shadow-2xl shadow-gray-900/20 hover:bg-orange-600 transition-all hover:scale-110 active:scale-95 relative group"
      >
        <MessageCircle className="w-6 h-6" />
        {!isOpen && (
           <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
            Live Support
          </span>
        )}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-600 rounded-full border-2 border-white animate-ping" />
      </button>
    </div>
  );
};

export default ChatWidget;
