// src/components/FloatingCartButton.jsx
import { useCart } from '../context/CartContext';

export default function FloatingCartButton() {
  const { cartItems, getCartTotal, openCart } = useCart();
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // عدم إظهار الزر إذا كانت السلة فارغة
  if (totalItemsCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-40 md:hidden">
      <button
        onClick={openCart}
        className="w-full bg-[#E11383] hover:bg-[#FF6600] text-white py-4 px-6 rounded-2xl font-black shadow-xl flex items-center justify-between transition-all duration-300 active:scale-95 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="bg-white text-[#E11383] w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
            {totalItemsCount}
          </span>
          <span>عرض السلة</span>
        </div>
        <span className="text-lg">
          {getCartTotal()} <span className="text-sm font-normal">ج.م</span>
        </span>
      </button>
    </div>
  );
}