import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { StoreSettings } from '../types';

interface StoreContextType {
  settings: StoreSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
}

const defaultSettings: StoreSettings = {
  storeName: 'AmarShop BD',
  email: 'support@amarshopbd.com',
  phone: '01XXXXXXXXX',
  address: 'Dhaka, Bangladesh',
  deliveryChargeInsideDhaka: 60,
  deliveryChargeOutsideDhaka: 120,
  bkashNumber: '',
  nagadNumber: '',
  heroBannerTitle: 'Premium Essentials',
  heroBannerSubtitle: 'Crafted with precision for the modern lifestyle',
  heroBannerUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600',
  whatsappNumber: '01XXXXXXXXX',
  coupons: [
    { code: 'WELCOME10', discountType: 'percentage', value: 10, isActive: true },
    { code: 'SAVEDK100', discountType: 'fixed', value: 100, minSpend: 1000, isActive: true }
  ],
  updatedAt: new Date().toISOString(),
};

const StoreContext = createContext<StoreContextType>({
  settings: defaultSettings,
  loading: true,
  updateSettings: async () => {},
});

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'config');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as StoreSettings);
      } else {
        // Initialize with default settings if not exists
        setDoc(settingsRef, defaultSettings).catch(console.error);
      }
      setLoading(false);
    }, (error) => {
      console.error("Store settings error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    const settingsRef = doc(db, 'settings', 'config');
    await setDoc(settingsRef, {
      ...settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  };

  return (
    <StoreContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
