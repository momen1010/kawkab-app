import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

// نوع البيانات للمنتج
const Product = {
  name: 'string',
  nameAr: 'string',
  description: 'string',
  descriptionAr: 'string',
  price: 'number',
  image: 'string',
  category: 'string'
};

const FirebaseDemo = () => {
  // States لإدارة البيانات والحالات
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    price: '',
    image: '',
    category: 'coffee'
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // جلب البيانات من Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // استعلام مرتب حسب السعر
        const q = query(collection(db, 'products'), orderBy('price', 'asc'));
        const querySnapshot = await getDocs(q);
        
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProducts(productsData);
        console.log('✅ تم جلب', productsData.length, 'منتج بنجاح');
      } catch (err) {
        console.error('❌ خطأ في جلب البيانات:', err);
        setError(`فشل في جلب البيانات: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // إضافة منتج جديد
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (submitting) return;
    
    try {
      setSubmitting(true);
      setError(null);
      setSubmitStatus(null);
      
      // التحقق من صحة البيانات
      if (!formData.name || !formData.price || parseFloat(formData.price) <= 0) {
        throw new Error('الاسم والسعر مطلوبان والسعر يجب أن يكون أكبر من 0');
      }

      // إضافة المنتج لـ Firestore
      const docRef = await addDoc(collection(db, 'products'), {
        ...formData,
        price: parseFloat(formData.price),
        createdAt: new Date()
      });

      setSubmitStatus(`✅ تم إضافة المنتج بنجاح! ID: ${docRef.id}`);
      
      // إعادة تعيين النموذج
      setFormData({
        name: '', nameAr: '', description: '', descriptionAr: '',
        price: '', image: '', category: 'coffee'
      });
      
      // إعادة تحميل البيانات
      window.location.reload();
      
    } catch (err) {
      console.error('❌ خطأ في إضافة المنتج:', err);
      setError(`فشل في إضافة المنتج: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات من Firestore...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-white/80 to-yellow-50/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-yellow-100/50 min-h-[80vh]">
      {/* العنوان */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#D4AF37] to-amber-600 bg-clip-text text-transparent mb-4">
          🔥 Firebase Firestore Demo
        </h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto">
          عرض وإضافة المنتجات باستخدام Firebase V9+ Modular SDK
        </p>
      </div>

      {/* حالة الخطأ */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* حالة الإرسال */}
      {submitStatus && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-green-800">{submitStatus}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* قسم النموذج */}
        <div className="space-y-6">
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-yellow-100/50">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              ➕ إضافة منتج جديد
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم (EN)</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all"
                  placeholder="مثال: Classic Espresso"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم (AR)</label>
                <input
                  name="nameAr"
                  value={formData.nameAr}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all dir-rtl"
                  placeholder="مثال: إسبريسو كلاسيك"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">السعر (SAR)</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all"
                  placeholder="مثال: 25"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الفئة</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all"
                >
                  <option value="coffee">☕ قهوة</option>
                  <option value="tea">🍵 شاي</option>
                  <option value="pastry">🥐 معجنات</option>
                  <option value="waffle">🧇 وافل</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 px-6 rounded-2xl font-semibold text-white transition-all transform hover:scale-105 ${
                  submitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#D4AF37] to-amber-600 hover:from-amber-500 hover:to-yellow-600 shadow-lg hover:shadow-2xl'
                }`}
              >
                {submitting ? (
                  <>
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></span>
                    جاري الإضافة...
                  </>
                ) : (
                  '➕ إضافة المنتج'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* قسم البيانات */}
        <div>
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-yellow-100/50 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              📊 المنتجات من Firestore ({products.length})
            </h2>
            {products.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>لا توجد بيانات حالياً<br />أضف منتجاً من اليسار للبدء 🔥</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200 hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 mr-4">
                      <span className="text-white font-bold text-sm">{product.price}ر</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 truncate">{product.name}</h4>
                      <p className="text-sm text-gray-600 dir-rtl">{product.nameAr}</p>
                      <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                    </div>
                    <span className="text-xs bg-[#e6f4ea] text-green-800 px-2 py-1 rounded-full font-medium">
                      ID: {product.id.slice(-6)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* معلومات الاتصال */}
          <div className="text-xs text-gray-500 text-center p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
            💡 نصيحة: أضف بيانات تجريبية في Firebase Console أو استخدم النموذج أعلاه
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseDemo;