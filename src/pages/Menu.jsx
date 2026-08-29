// src/pages/Menu.jsx
import { useState } from 'react';
import { products, categories } from '../data/products';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';

export default function Menu() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { searchQuery, setSearchQuery } = useCart();

  // تصفية المنتجات بناءً على التصنيف والبحث المباشر
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen pt-24 pb-16 bg-[#FFF8F3]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* الهيدر وشريط البحث */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="bg-[#E11383]/10 text-[#E11383] text-xs sm:text-sm font-black px-4 py-1.5 rounded-full inline-block mb-3">
            منتعش ومعد على الطلب ☕✨
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-[#3D2314] mb-4">
            قائمة <span className="text-[#FF6600]">السعادة</span>
          </h1>

          {/* Live Search Input */}
          <div className="relative max-w-md mx-auto mt-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن قهوة، وافل، أوساندوتش..."
              className="w-full px-5 py-3.5 pr-11 rounded-full bg-white border-2 border-orange-100 shadow-sm text-sm font-bold text-[#3D2314] focus:outline-none focus:border-[#FF6600] transition-colors"
            />
            <span className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 -translate-y-1/2 left-4 text-xs font-bold text-gray-400 hover:text-red-500"
              >
                مسح
              </button>
            )}
          </div>
        </div>

        {/* قسم عروض الـ Combo الخاصة */}
        {selectedCategory === 'all' && !searchQuery && (
          <div className="mb-10 bg-gradient-to-r from-[#FF6600] to-[#E11383] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-lg">
              <span className="bg-white text-[#E11383] text-xs font-black px-3 py-1 rounded-full inline-block mb-2">
                عرض اليوم 🔥
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mb-2">باكج السعادة الكامل 🍩☕</h2>
              <p className="text-xs sm:text-sm text-white/90 mb-4 font-medium">
                احصل على وافل نوتيلا كبير + أسبانيش لاتيه وسط بسعر 99 ج.م بدلاً من 135 ج.م!
              </p>
            </div>
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full font-black text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#FF6600] text-white shadow-md scale-105'
                    : 'bg-white text-[#3D2314] border border-orange-100 hover:bg-orange-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.nameAr}</span>
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-orange-100 max-w-md mx-auto">
            <span className="text-4xl">🔍</span>
            <h3 className="text-lg font-black text-[#3D2314] mt-2">لا توجد نتائج بحث</h3>
            <p className="text-xs text-gray-500 mt-1">جرب البحث باسم منتج آخر</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}