import { collection, addDoc, serverTimestamp, getDocs, query, limit } from 'firebase/firestore';
import { db } from './firebase';

const DEMO_PRODUCTS = [
  {
    name: "Aether Chronograph v1",
    description: "A masterpiece of temporal engineering. Features a brushed titanium casing, sapphire crystal glass, and a precision-engineered kinetic movement. Water-resistant up to 100m.",
    price: 12500,
    category: "Accessories",
    imageUrls: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=1000"
    ],
    stock: 15,
    variants: [
      { id: "v1", name: "Midnight Black", price: 12500, stock: 10 },
      { id: "v2", name: "Stellar Silver", price: 13000, stock: 5 }
    ],
    isActive: true,
    averageRating: 4.8,
    reviewCount: 12
  },
  {
    name: "Sonic Echo Pods",
    description: "True wireless audio with active noise cancellation and spatial sound mapping. 30-hour battery life with the charging case. Seamless connectivity for all your devices.",
    price: 4500,
    category: "Electronics",
    imageUrls: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=1000"
    ],
    stock: 50,
    isActive: true,
    averageRating: 4.5,
    reviewCount: 28
  },
  {
    name: "Vanguard Tech Pack",
    description: "Designed for the modern nomad. Weatherproof ballistic nylon, padded 16\" laptop compartment, and hidden security pockets. Ergonomic design for all-day comfort.",
    price: 8900,
    category: "Lifestyle",
    imageUrls: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1546750248-a7d61694f75e?auto=format&fit=crop&q=80&w=1000"
    ],
    stock: 20,
    isActive: true,
    averageRating: 4.9,
    reviewCount: 8
  },
  {
    name: "Zenith Mechanical Keyboard",
    description: "Hot-swappable mechanical keys with per-key RGB lighting and a solid aluminum frame. Gateron Brown switches pre-installed. USB-C and Bluetooth 5.0 compatible.",
    price: 7200,
    category: "Electronics",
    imageUrls: [
      "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1587829741301-dc798b83aca2?auto=format&fit=crop&q=80&w=1000"
    ],
    stock: 30,
    isActive: true,
    averageRating: 4.7,
    reviewCount: 15
  },
  {
    name: "Horizon Ultra-Wide Monitor",
    description: "34-inch curved display with 144Hz refresh rate and 99% sRGB color accuracy. Perfect for immersive gaming and professional creative work.",
    price: 42000,
    category: "Electronics",
    imageUrls: [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1547115941-079042097ca1?auto=format&fit=crop&q=80&w=1000"
    ],
    stock: 8,
    isActive: true,
    averageRating: 4.9,
    reviewCount: 22
  },
  {
    name: "Terra Minimalist Wallet",
    description: "Handcrafted top-grain leather wallet with RFID protection. Slim profile designed to hold up to 8 cards and cash without the bulk.",
    price: 3200,
    category: "Accessories",
    imageUrls: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1559334417-91b6ce79308e?auto=format&fit=crop&q=80&w=1000"
    ],
    stock: 45,
    isActive: true,
    averageRating: 4.6,
    reviewCount: 35
  },
  {
    name: "Lumina Smart Desk Lamp",
    description: "Adjustable color temperature and brightness with built-in wireless charging pad. Minimalist aesthetic suitable for any modern workspace.",
    price: 5800,
    category: "Lifestyle",
    imageUrls: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=1000"
    ],
    stock: 25,
    isActive: true,
    averageRating: 4.4,
    reviewCount: 19
  }
];

const DEMO_CATEGORIES = [
  { name: "Electronics", slug: "electronics" },
  { name: "Accessories", slug: "accessories" },
  { name: "Lifestyle", slug: "lifestyle" }
];

export const seedDemoData = async () => {
  try {
    // Check if we already have products
    const productsSnap = await getDocs(query(collection(db, 'products'), limit(1)));
    if (!productsSnap.empty) {
      console.log("Database already has products. Skipping seed.");
      return { success: false, message: "Database already populated" };
    }

    // Seed Categories
    for (const cat of DEMO_CATEGORIES) {
      await addDoc(collection(db, 'categories'), cat);
    }

    // Seed Products
    for (const prod of DEMO_PRODUCTS) {
      await addDoc(collection(db, 'products'), {
        ...prod,
        createdAt: serverTimestamp()
      });
    }

    return { success: true, message: "Demo data seeded successfully" };
  } catch (error) {
    console.error("Seeding error:", error);
    return { success: false, message: "Error seeding data" };
  }
};
