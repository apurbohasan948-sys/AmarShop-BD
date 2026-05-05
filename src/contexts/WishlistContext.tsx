import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { Product } from '../types';

interface WishlistContextType {
  items: Product[];
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Product[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    const unsub = onSnapshot(doc(db, 'wishlists', user.uid), (doc) => {
      if (doc.exists()) {
        setItems(doc.data().items || []);
      } else {
        setItems([]);
      }
    });

    return () => unsub();
  }, [user]);

  const toggleWishlist = async (product: Product) => {
    if (!user) return;

    const exists = items.find(item => item.id === product.id);
    let newItems;
    
    if (exists) {
      newItems = items.filter(item => item.id !== product.id);
    } else {
      newItems = [...items, product];
    }

    try {
      await setDoc(doc(db, 'wishlists', user.uid), { items: newItems });
    } catch (err) {
      console.error("Error updating wishlist:", err);
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some(item => item.id === productId);
  };

  return (
    <WishlistContext.Provider value={{ items, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
