// src/components/ProductCard.jsx
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import ProductModal from './ProductModal';

export default function ProductCard({ product }) {
  const { favorites, toggleFavorite } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isFav = favorites.some((f) => f.id === product.id);

  return (
    <>
      <div className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-orange-100 flex flex-col justify-between relative group">
        {/* زر المفضلة */}
        <button
          onClick={() => toggleFavorite(product)}
          className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-sm shadow-sm hover:scale-110 transition-all"
        >
          {isFav ? '❤️' : '🤍'}
        </button>

        {/* Image */}
        <div
          onClick={() => setIsModalOpen(true)}
          className="relative aspect-square bg-[#FFF8F3] p-4 flex items-center justify-center cursor-pointer overflow-hidden"
        >
          <img
            src={product.image}
            alt={product.nameAr}
            className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <div className="p-4 text-right">
          <h3 className="font-extrabold text-[#3D2314] text-base mb-1">{product.nameAr}</h3>
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{product.descriptionAr}</p>
          
          <div className="flex items-center justify-between pt-2 border-t border-orange-50">
            <span className="text-lg font-black text-[#FF6600]">
              {product.price} <span className="text-xs text-gray-500 font-normal">ج.م</span>
            </span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#FF6600] hover:bg-[#E11383] text-white px-4 py-2 rounded-full font-bold text-xs transition-all shadow-md active:scale-95"
            >
              تخصيص وطلب ⚙️
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && <ProductModal product={product} onClose={() => setIsModalOpen(false)} />}
    </>
  );
}