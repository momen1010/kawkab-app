// src/components/CartDrawer.jsx
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    earnedPoints,
    FREE_DELIVERY_LIMIT,
    deliveryType,
    setDeliveryType,
  } = useCart();

  const total = getCartTotal();
  const progress = Math.min((total / FREE_DELIVERY_LIMIT) * 100, 100);
  const remainingForFree = FREE_DELIVERY_LIMIT - total;

  if (!isCartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={closeCart} />

      <div className="fixed top-0 left-0 bottom-0 w-full sm:max-w-[420px] bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-orange-100 bg-[#FFF8F3]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-black text-[#3D2314]">سلة المشتريات 🍩</h2>
              <p className="text-xs text-gray-500 font-bold">{cartItems.length} أصناف في السلة</p>
            </div>
            <button
              onClick={closeCart}
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-gray-500 hover:bg-[#E11383] hover:text-white transition-all shadow-sm border border-orange-100"
            >
              ✕
            </button>
          </div>

          {/* نوع الاستلام */}
          <div className="flex bg-white p-1 rounded-full border border-orange-200">
            <button
              onClick={() => setDeliveryType('delivery')}
              className={`flex-1 py-1.5 text-xs font-black rounded-full transition-all ${
                deliveryType === 'delivery' ? 'bg-[#FF6600] text-white shadow-sm' : 'text-gray-600'
              }`}
            >
              🛵 توصيل للمنزل
            </button>
            <button
              onClick={() => setDeliveryType('pickup')}
              className={`flex-1 py-1.5 text-xs font-black rounded-full transition-all ${
                deliveryType === 'pickup' ? 'bg-[#FF6600] text-white shadow-sm' : 'text-gray-600'
              }`}
            >
              🏪 استلام من الفرع
            </button>
          </div>
        </div>

        {/* Free Delivery Progress Bar */}
        {deliveryType === 'delivery' && (
          <div className="bg-orange-50 px-4 py-3 border-b border-orange-100">
            <div className="text-xs font-extrabold text-[#3D2314] mb-1.5 flex justify-between">
              {remainingForFree > 0 ? (
                <span>أضف <strong className="text-[#FF6600]">{remainingForFree} ج.م</strong> للحصول على توصيل مجاني! 🎉</span>
              ) : (
                <span className="text-[#27AE60]">مبروك! حصلت على توصيل مجاني 🚀</span>
              )}
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF6600] to-[#E11383] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <span className="text-5xl mb-3">🛒</span>
              <h3 className="text-lg font-black text-[#3D2314] mb-1">السلة فارغة حالياً</h3>
              <p className="text-xs text-gray-500 mb-4">اكتشف منتجاتنا الرائعة وأضفها لسلتك!</p>
              <button
                onClick={closeCart}
                className="bg-[#FF6600] text-white px-6 py-2.5 rounded-full font-black text-sm shadow-md"
              >
                تصفح القائمة
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-3 p-3 bg-[#FFF8F3] rounded-2xl border border-orange-100"
              >
                <img
                  src={item.product.image}
                  alt={item.product.nameAr}
                  className="w-16 h-16 rounded-xl object-cover bg-white p-1"
                />
                <div className="flex-1 min-w-0 text-right">
                  <h4 className="font-extrabold text-[#3D2314] text-sm truncate">{item.product.nameAr}</h4>
                  <p className="text-xs font-black text-[#FF6600] mt-0.5">
                    {item.product.price * item.quantity} <span className="text-[10px] text-gray-500">ج.م</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-full p-1 border border-orange-200">
                  <button
                    onClick={() => updateQuantity(item.key, item.quantity - 1)}
                    className="w-6 h-6 rounded-full font-bold text-xs"
                  >
                    -
                  </button>
                  <span className="text-xs font-black">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.key, item.quantity + 1)}
                    className="w-6 h-6 rounded-full font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-orange-100 bg-white space-y-3">
            {/* Loyalty Points Badge */}
            <div className="bg-[#FFF8F3] p-2.5 rounded-xl border border-orange-200 flex items-center justify-between text-xs font-bold text-[#3D2314]">
              <span>🌟 نقاط السعادة المكتسبة:</span>
              <span className="text-[#E11383] font-black text-sm">+{earnedPoints} نقطة</span>
            </div>

            <div className="flex items-center justify-between text-[#3D2314]">
              <span className="font-bold text-sm">المجموع الكلي</span>
              <span className="text-xl font-black text-[#FF6600]">{total} <span className="text-xs">ج.م</span></span>
            </div>

            <Link
              to="/checkout"
              onClick={closeCart}
              className="bg-[#E11383] hover:bg-[#FF6600] text-white w-full py-3.5 rounded-full font-black text-center block shadow-lg text-base transition-all active:scale-95"
            >
              إتمام الطلب الآن 🚀
            </Link>
          </div>
        )}
      </div>
    </>
  );
}