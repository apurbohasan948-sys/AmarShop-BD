import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, query, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Product, Review, ProductVariant } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Star, ShieldCheck, Truck, RotateCcw, ChevronLeft, ChevronRight, Plus, Minus, MessageSquare, Send, Heart, CheckCircle2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWishlist } from '../contexts/WishlistContext';
import ProductCard from '../components/ProductCard';

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [added, setAdded] = useState(false);
  
  const { addToCart } = useCart();
  const { user, profile } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  const active = !!id && isInWishlist(id);

  const fetchProduct = async () => {
    if (!id) return;
    const docSnap = await getDoc(doc(db, 'products', id));
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() } as Product;
      setProduct(data);
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      }
    }
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity, selectedVariant || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const fetchReviews = async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const reviewsQuery = query(
        collection(db, 'products', id, 'reviews'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(reviewsQuery);
      setReviews(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchRelatedProducts = async (category: string) => {
    if (!id) return;
    setRelatedLoading(true);
    try {
      const q = query(
        collection(db, 'products'),
        where('category', '==', category),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Product))
        .filter(p => p.id !== id)
        .slice(0, 5);
      setRelatedProducts(fetched);
    } catch (err) {
      console.error("Error fetching related products:", err);
    } finally {
      setRelatedLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const docSnap = await getDoc(doc(db, 'products', id || ''));
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Product;
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
        fetchRelatedProducts(data.category);
      }
      setLoading(false);
    };

    loadData();
    fetchReviews();
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !newReview.comment.trim()) return;

    setSubmittingReview(true);
    try {
      await addDoc(collection(db, 'products', id, 'reviews'), {
        userId: user.uid,
        userName: profile?.fullName || user.displayName || 'Anonymous User',
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: serverTimestamp(),
      });
      setNewReview({ rating: 5, comment: '' });
      fetchReviews();
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-orange-600 animate-pulse uppercase tracking-widest">Loading Product...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-gray-400 italic">Product not found.</div>;

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "No ratings";

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-gray-400 hover:text-gray-900 transition-colors mb-12 font-bold uppercase tracking-widest text-xs group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to products</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-24">
          {/* Image Gallery */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="aspect-[4/5] bg-gray-50 rounded-[3rem] overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-100">
              <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {product.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.imageUrls.map((url, i) => (
                  <div key={i} className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 cursor-pointer hover:border-orange-600 transition-all opacity-60 hover:opacity-100">
                    <img src={url} alt={`${product.name} ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 md:space-y-10"
          >
            <div className="space-y-3 md:space-y-4">
              <span className="bg-orange-50 text-orange-600 px-4 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border border-orange-100">
                {product.category}
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight italic">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-4 md:space-x-6">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                  <span className="text-sm font-bold text-gray-900 ml-1">{averageRating}</span>
                  <span className="text-sm font-bold text-gray-400 ml-1">({reviews.length} Reviews)</span>
                </div>
                <div className="hidden md:block h-4 w-px bg-gray-200" />
                <span className={`font-bold text-xs md:text-sm uppercase tracking-widest ${
                  (selectedVariant ? selectedVariant.stock : product.stock) > 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {(selectedVariant ? selectedVariant.stock : product.stock) > 0 
                    ? `In Stock (${selectedVariant ? selectedVariant.stock : product.stock})` 
                    : "Out of Stock"}
                </span>
              </div>
            </div>

            <div className="flex items-baseline space-x-4">
              <span className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter italic">৳{(selectedVariant ? selectedVariant.price : product.price).toLocaleString()}</span>
              <span className="text-lg md:text-xl text-gray-400 line-through italic font-medium opacity-50">৳{Math.round((selectedVariant ? selectedVariant.price : product.price) * 1.25).toLocaleString()}</span>
            </div>

            {/* Variant Selection UI */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                  <span>Choice of Version</span>
                  <span className="w-8 h-px bg-gray-100" />
                </p>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${
                        selectedVariant?.id === v.id
                          ? 'bg-gray-900 text-white border-gray-900 shadow-xl scale-105'
                          : 'bg-white text-gray-400 border-gray-100 hover:border-orange-600 hover:text-orange-600'
                      } ${v.stock === 0 ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-gray-500 font-medium leading-relaxed italic border-l-4 border-orange-600 pl-4 md:pl-6 py-1 md:py-2 text-sm md:text-base">
              {product.description}
            </p>

            <div className="space-y-4 md:space-y-6 pt-2 md:pt-6 mb-6 md:mb-10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:space-x-6">
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-2xl border border-gray-100 w-full sm:w-auto">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-3 hover:text-orange-600 transition-colors disabled:opacity-30"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-12 text-center font-black text-xl text-gray-900 tracking-tight">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-3 hover:text-orange-600 transition-colors disabled:opacity-30"
                    disabled={quantity >= (selectedVariant ? selectedVariant.stock : product.stock)}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <button 
                  onClick={handleAddToCart}
                  disabled={(selectedVariant ? selectedVariant.stock : product.stock) <= 0 || added}
                  className={`flex-1 py-4 md:py-5 rounded-[2rem] font-black text-base md:text-lg transition-all shadow-2xl flex items-center justify-center space-x-3 active:scale-95 disabled:bg-gray-200 disabled:shadow-none disabled:cursor-not-allowed ${
                    added 
                      ? 'bg-green-600 shadow-green-500/30' 
                      : 'bg-gray-900 text-white shadow-gray-900/30 hover:bg-orange-600'
                  }`}
                >
                  {added ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 md:w-6 h-6" />
                      <span>Added to Bag</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 md:w-6 h-6" />
                      <span>{(selectedVariant ? selectedVariant.stock : product.stock) > 0 ? "Add to Bag" : "Sold Out"}</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => toggleWishlist(product)}
                  className={`p-4 md:p-5 rounded-[2rem] border transition-all active:scale-95 flex items-center justify-center ${
                    active ? 'bg-orange-600 border-orange-600 text-white shadow-xl shadow-orange-600/20' : 'bg-white border-gray-100 text-gray-400 hover:text-orange-600'
                  }`}
                >
                  <Heart className={`w-5 h-5 md:w-6 h-6 ${active ? 'fill-white' : ''}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-gray-100">
              <div className="flex flex-col items-center text-center p-4">
                <Truck className="w-6 h-6 text-orange-600 mb-2" />
                <span className="text-xs font-black text-gray-900 uppercase">Fast Ship</span>
                <span className="text-[10px] text-gray-400 italic">2-3 Day Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <RotateCcw className="w-6 h-6 text-orange-600 mb-2" />
                <span className="text-xs font-black text-gray-900 uppercase">Returns</span>
                <span className="text-[10px] text-gray-400 italic">7 Day Exchange</span>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <ShieldCheck className="w-6 h-6 text-orange-600 mb-2" />
                <span className="text-xs font-black text-gray-900 uppercase">Verified</span>
                <span className="text-[10px] text-gray-400 italic">Official Warranty</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="max-w-4xl mx-auto border-t border-gray-100 pt-16">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Customer Reviews</h2>
            <div className="flex items-center space-x-2 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
              <Star className="w-4 h-4 fill-orange-600 text-orange-600" />
              <span className="text-sm font-black text-orange-600 tracking-tight">{averageRating}</span>
            </div>
          </div>

          {/* Add Review Form */}
          {user ? (
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onSubmit={handleReviewSubmit} 
              className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 mb-16"
            >
              <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center">
                <MessageSquare className="w-5 h-5 mr-3 text-orange-600" />
                Post your review
              </h3>
              
              <div className="mb-6">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Your Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className="transition-transform active:scale-95"
                    >
                      <Star className={`w-6 h-6 ${star <= newReview.rating ? 'fill-orange-400 text-orange-400' : 'text-gray-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Your Experience</label>
                <textarea
                  required
                  placeholder="Tell others about your experience with this product..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 outline-none transition-all h-32 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview || !newReview.comment.trim()}
                className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-gray-900/10 flex items-center space-x-2 hover:bg-orange-600 transition-all disabled:opacity-50 active:scale-95"
              >
                <span>{submittingReview ? 'Posting...' : 'Post Review'}</span>
                <Send className="w-4 h-4" />
              </button>
            </motion.form>
          ) : (
            <div className="bg-orange-50/50 border border-orange-100 p-8 rounded-[2.5rem] text-center mb-16 italic">
              <p className="text-orange-900 font-medium">Please <button onClick={() => navigate('/auth')} className="font-black underline">Sign In</button> to post a review.</p>
            </div>
          )}

          {/* Reviews List */}
          {reviewsLoading ? (
            <div className="space-y-8">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-50 rounded w-1/4" />
                  <div className="h-20 bg-gray-50 rounded w-full" />
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-8">
              <AnimatePresence>
                {reviews.map((review, i) => (
                  <motion.div 
                    key={review.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm font-black text-gray-900">{review.userName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                          {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                        </p>
                      </div>
                      <div className="flex space-x-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-orange-400 text-orange-400' : 'text-gray-100'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium italic leading-relaxed">
                      "{review.comment}"
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-medium italic">No reviews yet. Be the first to tell us what you think!</p>
            </div>
          )}
        </div>

        {/* Related Products Section */}
        <div className="mt-32 border-t border-gray-100 pt-16">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">You May Also Like</h2>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2 flex items-center">
                <span className="w-8 h-px bg-gray-100 mr-3" />
                Featured in {product.category}
              </p>
            </div>
            <div className="flex space-x-2">
               <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                  <ChevronLeft className="w-5 h-5" />
               </div>
               <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                  <ChevronRight className="w-5 h-5" />
               </div>
            </div>
          </div>

          {relatedLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="aspect-[4/5] bg-gray-50 rounded-[2rem] animate-pulse" />
              ))}
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="relative group">
              <div className="flex overflow-x-auto pb-8 -mx-4 px-4 space-x-6 scrollbar-hide snap-x">
                {relatedProducts.map((p) => (
                  <div key={p.id} className="min-w-[280px] md:min-w-[320px] snap-start">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-medium italic">Discover more gems in our store!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
