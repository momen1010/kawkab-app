// src/components/ProductModal.jsx
import { useState } from 'react';
import { useCart } from '../context/CartContext';

// قائمة الصوصات للحلويات والمعجنات والوافل فقط 🍩 waffle & pastries
const SAUCE_OPTIONS = [
  { id: 'white_chocolate', name: 'وايت شوكلت (شوكولاتة بيضاء)', price: 15 },
  { id: 'caramel', name: 'كراميل غني', price: 12 },
  { id: 'vanilla', name: 'فانيليا فرنسية', price: 10 },
  { id: 'nutella', name: 'نوتيلا أصلي', price: 20 },
  { id: 'pistachio', name: 'بستاشيو (فستق)', price: 25 },
  { id: 'lotus', name: 'زبدة اللوتس', price: 20 },
  { id: 'dark_chocolate', name: 'دارك شوكلت', price: 15 },
  { id: 'strawberry', name: 'صوص فراولة', price: 10 },
];

export default function ProductModal({ product, onClose }) {
  const { addToCart } = useCart();

  // تحديد نوع المنتج
  const isBeverage = product.category === 'coffee' || product.category === 'tea';
  const isSweets = product.category === 'waffle' || product.category === 'pastry' || product.category === 'special';

  // تسعير الأحجام للمشروبات فقط
  const basePrice = product.price;
  const sizePrices = {
    'صغير': Math.max(10, basePrice - 10),
    'وسط': basePrice,
    'كبير': basePrice + 15,
  };

  const [selectedSize, setSelectedSize] = useState('وسط');
  const [selectedSauces, setSelectedSauces] = useState([]);
  const [quantity, setQuantity] = useState(1);

  // تبديل اختيار الصوصات (للمأكولات والحلويات فقط)
  const toggleSauce = (sauce) => {
    setSelectedSauces((prev) => {
      const exists = prev.some((s) => s.id === sauce.id);
      if (exists) {
        return prev.filter((s) => s.id !== sauce.id);
      } else {
        return [...prev, sauce];
      }
    });
  };

  // حساب السعر النهائي للقطعة
  const currentUnitPrice = isBeverage ? sizePrices[selectedSize] : basePrice;
  const totalSaucesPrice = isSweets ? selectedSauces.reduce((sum, s) => sum + s.price, 0) : 0;
  const finalUnitPrice = currentUnitPrice + totalSaucesPrice;

  const handleAddToCart = () => {
    const customOptions = {
      size: isBeverage ? selectedSize : null,
      sauces: isSweets ? selectedSauces.map((s) => s.name) : [],
    };

    const customizedProduct = {
      ...product,
      price: finalUnitPrice,
    };

    addToCart(customizedProduct, quantity, customOptions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-right flex flex-col max-h-[90vh]">
        
        {/* الصورة والهيدر */}
        <div className="relative h-44 bg-[#FFF8F3] p-4 flex items-center justify-center flex-shrink-0 border-b border-orange-100">
          <img src={product.image} alt={product.nameAr} className="h-full object-contain" />
          <button
            onClick={onClose}
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white font-bold text-gray-500 shadow-sm hover:bg-[#E11383] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* محتوى التفاصيل */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          <div>
            <h3 className="text-xl font-black text-[#3D2314]">{product.nameAr}</h3>
            <p className="text-xs text-gray-500 mt-1">{product.descriptionAr}</p>
          </div>

          {/* 1. تحديد الحجم بسعر مختلف (للمشروبات فقط ☕🍵) */}
          {isBeverage && (
            <div>
              <label className="text-xs font-black text-[#3D2314] block mb-2">اختر الحجم المناسب:</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(sizePrices).map(([sizeName, price]) => (
                  <button
                    key={sizeName}
                    type="button"
                    onClick={() => setSelectedSize(sizeName)}
                    className={`py-2.5 px-2 rounded-2xl border text-xs font-black flex flex-col items-center gap-1 transition-all ${
                      selectedSize === sizeName
                        ? 'border-[#FF6600] bg-orange-50 text-[#FF6600] shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{sizeName}</span>
                    <span className="text-[11px] font-bold text-gray-400">{price} ج.م</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. إضافة الصوصات (للمعجنات والوافل والحلويات فقط 🧇🥐🍰) */}
          {isSweets && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-black text-[#3D2314]">إضافة صوصات غنية (اختياري):</label>
                <span className="text-[10px] text-gray-400 font-bold">تستطيع اختيار أكثر من صوص</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAUCE_OPTIONS.map((sauce) => {
                  const isSelected = selectedSauces.some((s) => s.id === sauce.id);
                  return (
                    <button
                      key={sauce.id}
                      type="button"
                      onClick={() => toggleSauce(sauce)}
                      className={`p-2.5 rounded-xl border text-right flex items-center justify-between text-xs font-bold transition-all ${
                        isSelected
                          ? 'border-[#E11383] bg-pink-50 text-[#E11383]'
                          : 'border-orange-100 bg-[#FFF8F3] text-[#3D2314] hover:border-orange-200'
                      }`}
                    >
                      <span className="truncate">{sauce.name}</span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-gray-100 shrink-0">
                        +{sauce.price} ج.م
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* الفوتر والتحكم بالكمية والإضافة */}
        <div className="p-4 border-t border-orange-100 bg-white flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 bg-[#FFF8F3] px-3 py-2 rounded-full border border-orange-200">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-6 h-6 rounded-full font-black text-[#3D2314] hover:bg-orange-100 flex items-center justify-center"
            >
              -
            </button>
            <span className="font-black text-sm text-[#3D2314]">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-6 h-6 rounded-full font-black text-[#3D2314] hover:bg-orange-100 flex items-center justify-center"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex-1 bg-[#FF6600] hover:bg-[#E11383] text-white py-3 px-4 rounded-full font-black text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-1"
          >
            <span>أضف للسلة</span>
            <span>•</span>
            <span>{finalUnitPrice * quantity} ج.م</span>
          </button>
        </div>

      </div>
    </div>
  );
}