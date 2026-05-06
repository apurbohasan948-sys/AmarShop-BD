export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: 'admin' | 'customer';
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrls: string[];
  stock: number;
  variants?: ProductVariant[];
  averageRating?: number;
  reviewCount?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minSpend?: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant?: ProductVariant;
}

export interface Address {
  district: string;
  upazila: string;
  street: string;
}

export interface Order {
  id?: string;
  customerUid: string;
  customerName: string;
  customerPhone: string;
  address: Address;
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  transactionId: string;
  paymentMethod: 'bKash' | 'Nagad';
  paymentStatus: 'pending' | 'verified' | 'rejected';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any; // Firestore Timestamp
}

export interface Review {
  id?: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any; // Firestore Timestamp
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderRole: 'admin' | 'customer';
  text: string;
  createdAt: any;
}

export interface ChatSession {
  id: string; // userId
  customerName: string;
  lastMessage: string;
  lastMessageAt: any;
  unreadCount: number;
}

export interface StoreSettings {
  storeName: string;
  email: string;
  phone: string;
  address: string;
  deliveryChargeInsideDhaka: number;
  deliveryChargeOutsideDhaka: number;
  bkashNumber: string;
  nagadNumber: string;
  facebookUrl?: string;
  instagramUrl?: string;
  updatedAt: any;
  heroBannerTitle?: string;
  heroBannerSubtitle?: string;
  heroBannerUrl?: string;
  whatsappNumber?: string;
  liveChatType?: 'whatsapp' | 'built-in';
  coupons?: Coupon[];
}
